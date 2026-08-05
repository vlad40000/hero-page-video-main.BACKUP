import 'server-only';

import fs from 'fs/promises';
import path from 'path';

import { getJobPaths } from '@/lib/tools/parts/agents/state';

export async function writeArtifact(jobId, relativePath, value) {
  const { artifactsDir } = getJobPaths(jobId);
  const artifactPath = path.join(artifactsDir, relativePath);
  await fs.mkdir(path.dirname(artifactPath), { recursive: true });

  const content = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  await fs.writeFile(artifactPath, content, 'utf8');

  return artifactPath;
}

export async function readArtifact(jobId, relativePath, { parseJson = false } = {}) {
  const { artifactsDir } = getJobPaths(jobId);
  const artifactPath = path.join(artifactsDir, relativePath);
  const content = await fs.readFile(artifactPath, 'utf8');
  return parseJson ? JSON.parse(content) : content;
}

export async function writeLog(jobId, relativePath, value) {
  const { logsDir } = getJobPaths(jobId);
  const logPath = path.join(logsDir, relativePath);
  await fs.mkdir(path.dirname(logPath), { recursive: true });
  await fs.writeFile(logPath, typeof value === 'string' ? value : JSON.stringify(value, null, 2), 'utf8');
  return logPath;
}
