import 'server-only';

import { 
  generateImageAsset, 
  generateStructuredJson, 
  extractModelNumberFromImage 
} from '@/lib/tools/parts/gemini';
import { 
  getPartsForModel 
} from '@/lib/tools/parts/parts-service';
import { 
  createJobState, 
  readJobState, 
  updateJobState 
} from '@/lib/tools/parts/agents/state';
import { writeArtifact } from '@/lib/tools/parts/agents/artifact-store';
import { classifyDirectRequest, createTask } from '@/lib/tools/parts/agents/task-router';
import { summarizeReviewerNeed } from '@/lib/tools/parts/agents/reviewer-gates';

const supervisorPlanSchema = {
  type: 'object',
  properties: {
    mode: { type: 'string', enum: ['direct', 'agentic'] },
    summaryRequested: { type: 'boolean' },
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          skill: { type: 'string', enum: ['analyzer', 'designer'] },
          kind: { type: 'string', enum: ['parts_discovery', 'visual_asset'] },
          canRunInParallel: { type: 'boolean' },
          requiresGrounding: { type: 'boolean' },
          artifactPath: { type: 'string' },
        },
        required: ['id', 'skill', 'kind', 'canRunInParallel', 'requiresGrounding', 'artifactPath'],
      },
    },
  },
  required: ['mode', 'summaryRequested', 'tasks'],
};

const reviewerSchema = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['pass', 'reject'] },
    finalOutput: { type: 'string' },
    reasons: { type: 'array', items: { type: 'string' } },
  },
  required: ['verdict', 'finalOutput', 'reasons'],
};

async function runDirect(input) {
  const route = classifyDirectRequest(input);

  if (route.handler === 'extract-model') {
    return {
      mode: 'direct',
      handler: route.handler,
      result: await extractModelNumberFromImage(input.imageBase64, input.mimeType),
    };
  }

  if (route.handler === 'parts-search') {
    return {
      mode: 'direct',
      handler: route.handler,
      result: await getPartsForModel(input.modelNumber, input.selectedSources || []),
    };
  }


  throw new Error(`Unsupported direct handler: ${route.handler}`);
}

async function createSupervisorPlan(jobState) {
  const requestJson = JSON.stringify(jobState.originalRequest, null, 2);
  const prompt = `You are the supervisor-router. Plan the request.\n\nRequest:\n${requestJson}\n\nRules:\n- Use direct if simple search.\n- Use analyzer for lists/pricing.\n- Use designer for visuals.\n- Structural JSON only.`;

  const { data } = await generateStructuredJson({
    role: 'supervisor',
    tool: 'bom',
    bucket: 'bom.heavy',
    requestContext: { route: 'parts.orchestrator.plan', jobId: jobState.jobId },
    contents: prompt,
    schema: supervisorPlanSchema,
    temperature: 0.1,
    fallback: { mode: 'agentic', summaryRequested: false, tasks: [] },
  });

  return data;
}

async function runAnalyzerTask(task, request) {
  if (task.kind === 'parts_discovery') {
    return getPartsForModel(request.modelNumber, request.selectedSources || []);
  }


  throw new Error(`Unsupported analyzer task kind: ${task.kind}`);
}

async function runDesignerTask(task, request) {
  if (task.kind !== 'visual_asset') {
    throw new Error(`Unsupported designer task kind: ${task.kind}`);
  }

  return generateImageAsset({
    prompt: request.prompt || request.designPrompt || 'Visual asset.',
    role: 'designer',
  });
}

async function executeTask(task, request, jobId) {
  let artifact;

  if (task.skill === 'analyzer') {
    artifact = await runAnalyzerTask(task, request);
  } else if (task.skill === 'designer') {
    artifact = await runDesignerTask(task, request);
  } else {
    throw new Error(`Unsupported skill: ${task.skill}`);
  }

  const artifactPath = task.artifactPath || `${task.id}.json`;
  await writeArtifact(jobId, artifactPath, artifact);

  return {
    ...task,
    status: 'complete',
    artifactPath,
  };
}

async function runReviewer(state) {
  const prompt = `Review task completion.\n\nRequest:\n${JSON.stringify(state.originalRequest, null, 2)}\n\nRequirements:\n- JSON verdict pass/reject.`;

  const { data } = await generateStructuredJson({
    role: 'reviewer',
    tool: 'bom',
    bucket: 'bom.heavy',
    requestContext: { route: 'parts.orchestrator.review', jobId: state.jobId },
    contents: prompt,
    schema: reviewerSchema,
    temperature: 0.1,
    fallback: { verdict: 'pass', finalOutput: 'Review completed.', reasons: [] },
  });

  return data;
}

export async function orchestrateRequest(input) {
  const route = classifyDirectRequest(input);

  if (route.mode === 'direct') {
    return runDirect(input);
  }

  const jobState = await createJobState({
    originalRequest: input,
    mode: 'agentic',
    metadata: {
      summaryRequested: Boolean(input.summaryRequested),
    },
  });

  const plan = await createSupervisorPlan(jobState);
  const tasks = (plan.tasks || []).map((task) => createTask({
    ...task,
    input: input,
    confidence: 'high',
  }));

  await updateJobState(jobState.jobId, (current) => ({
    ...current,
    status: 'planned',
    metadata: {
      ...current.metadata,
      summaryRequested: Boolean(plan.summaryRequested),
    },
    tasks,
  }));

  const completedTasks = await Promise.all(
    tasks.map(async (task) => {
      try {
        return await executeTask(task, input, jobState.jobId);
      } catch (error) {
        return {
          ...task,
          status: 'failed',
          confidence: 'low',
          error: error.message,
        };
      }
    })
  );

  await updateJobState(jobState.jobId, (current) => ({
    ...current,
    status: completedTasks.some((task) => task.status === 'failed') ? 'review-pending' : 'completed',
    tasks: completedTasks,
    errors: completedTasks.filter((task) => task.status === 'failed').map((task) => task.error),
  }));

  const latestState = await readJobState(jobState.jobId);
  const reviewDecision = summarizeReviewerNeed(latestState);

  if (!reviewDecision.runReviewer) {
    return {
      mode: 'agentic',
      handler: 'orchestrator',
      jobId: jobState.jobId,
      state: latestState,
      review: null,
    };
  }

  const review = await runReviewer(latestState);
  const finalState = await updateJobState(jobState.jobId, (current) => ({
    ...current,
    status: review.verdict === 'pass' ? 'done' : 'rejected',
    review,
  }));

  return {
    mode: 'agentic',
    handler: 'orchestrator',
    jobId: jobState.jobId,
    state: finalState,
    review,
  };
}
