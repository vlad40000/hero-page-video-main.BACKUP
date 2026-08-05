import 'server-only';

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const RUNS_ROOT = process.env.NODE_ENV === 'production'
  ? path.join('/tmp', 'partsapp-agent-runs')
  : path.join(process.cwd(), '.agents', 'runs');

function getJobDir(jobId) {
  return path.join(RUNS_ROOT, jobId);
}

function getWorkflowStatePath(jobId) {
  return path.join(getJobDir(jobId), 'workflow_state.json');
}

export function createJobId() {
  return `job_${crypto.randomUUID()}`;
}

export async function ensureJobDirectories(jobId) {
  const jobDir = getJobDir(jobId);
  await fs.mkdir(path.join(jobDir, 'artifacts'), { recursive: true });
  await fs.mkdir(path.join(jobDir, 'logs'), { recursive: true });
  return jobDir;
}

export async function createJobState({ originalRequest, mode = 'agentic', metadata = {} }) {
  const jobId = createJobId();
  await ensureJobDirectories(jobId);

  const initialState = {
    version: 1,
    jobId,
    mode,
    status: 'created',
    originalRequest,
    metadata,
    tasks: [],
    artifacts: {},
    review: null,
    errors: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await writeJobState(jobId, initialState);
  return initialState;
}

export async function readJobState(jobId) {
  const filePath = getWorkflowStatePath(jobId);
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

export async function writeJobState(jobId, state) {
  await ensureJobDirectories(jobId);
  const nextState = {
    ...state,
    updatedAt: new Date().toISOString(),
  };
  const filePath = getWorkflowStatePath(jobId);
  await fs.writeFile(filePath, JSON.stringify(nextState, null, 2), 'utf8');
  return nextState;
}

export async function updateJobState(jobId, updater) {
  const current = await readJobState(jobId);
  const next = typeof updater === 'function' ? await updater(current) : { ...current, ...updater };
  return writeJobState(jobId, next);
}

export function getJobPaths(jobId) {
  const jobDir = getJobDir(jobId);
  return {
    jobDir,
    statePath: getWorkflowStatePath(jobId),
    artifactsDir: path.join(jobDir, 'artifacts'),
    logsDir: path.join(jobDir, 'logs'),
  };
}
