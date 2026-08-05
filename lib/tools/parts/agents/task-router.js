import 'server-only';

export function classifyDirectRequest(input = {}) {
  const directType = input.directType || input.requestType;

  if (directType === 'extract-model') return { mode: 'direct', handler: 'extract-model' };
  if (directType === 'parts-search') return { mode: 'direct', handler: 'parts-search' };

  if (input.imageBase64 && input.mimeType) return { mode: 'direct', handler: 'extract-model' };
  if (input.modelNumber && !input.prompt) return { mode: 'direct', handler: 'parts-search' };

  return { mode: 'agentic', handler: 'supervisor' };
}

export function createTask({
  id,
  skill,
  kind,
  input,
  canRunInParallel = false,
  requiresGrounding = false,
  artifactPath,
  confidence = 'high',
}) {
  return {
    id,
    skill,
    kind,
    status: 'pending',
    canRunInParallel,
    requiresGrounding,
    confidence,
    artifactPath,
    input,
  };
}
