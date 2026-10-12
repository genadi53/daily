import type { LessonPayload, QuizQuestion } from './types';
import { basicAuthHeader } from './utils';

const API_BASE = 'https://api.cursor.com/v1';

export type ProgressCallback = (message: string) => void;

interface CreateAgentResponse {
  agent: { id: string; latestRunId?: string };
  run: { id: string; status: string };
}

interface GetRunResponse {
  id: string;
  agentId: string;
  status: string;
  result?: string;
}

function authHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: basicAuthHeader(apiKey),
    'Content-Type': 'application/json',
  };
}

async function createNoRepoAgent(
  apiKey: string,
  promptText: string,
  name?: string,
): Promise<CreateAgentResponse> {
  const res = await fetch(`${API_BASE}/agents`, {
    method: 'POST',
    headers: authHeaders(apiKey),
    body: JSON.stringify({
      prompt: { text: promptText },
      name: name ?? 'Daily Learner',
      // Omit repos + env → no-repo cloud agent
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `Failed to create agent (${res.status}): ${body || res.statusText}`,
    );
  }

  return (await res.json()) as CreateAgentResponse;
}

async function getRun(
  apiKey: string,
  agentId: string,
  runId: string,
): Promise<GetRunResponse> {
  const res = await fetch(`${API_BASE}/agents/${agentId}/runs/${runId}`, {
    headers: authHeaders(apiKey),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `Failed to get run (${res.status}): ${body || res.statusText}`,
    );
  }
  return (await res.json()) as GetRunResponse;
}

async function streamRun(
  apiKey: string,
  agentId: string,
  runId: string,
  onProgress?: ProgressCallback,
): Promise<string> {
  const res = await fetch(
    `${API_BASE}/agents/${agentId}/runs/${runId}/stream`,
    {
      headers: {
        Authorization: basicAuthHeader(apiKey),
        Accept: 'text/event-stream',
      },
    },
  );

  if (res.status === 410) {
    throw new Error('STREAM_EXPIRED');
  }

  if (!res.ok || !res.body) {
    throw new Error(`Stream failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let assistantText = '';
  let resultText = '';
  let terminalStatus: string | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() ?? '';

    for (const chunk of chunks) {
      const lines = chunk.split('\n');
      let event = 'message';
      const dataLines: string[] = [];
      for (const line of lines) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
      }
      if (!dataLines.length) continue;
      const raw = dataLines.join('\n');
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        continue;
      }

      if (event === 'status') {
        const status = String(data.status ?? '');
        onProgress?.(statusLabel(status));
      } else if (event === 'assistant') {
        assistantText += String(data.text ?? '');
      } else if (event === 'tool_call') {
        const name = String(data.name ?? 'tool');
        const status = String(data.status ?? '');
        onProgress?.(
          status === 'running' ? `Using ${name}…` : `Finished ${name}`,
        );
      } else if (event === 'result') {
        terminalStatus = String(data.status ?? '');
        if (typeof data.text === 'string') resultText = data.text;
      } else if (event === 'error') {
        throw new Error(String(data.message ?? 'Stream error'));
      } else if (event === 'done') {
        // stream complete
      }
    }
  }

  if (
    terminalStatus &&
    !['FINISHED', 'SUCCEEDED', 'COMPLETED'].includes(terminalStatus)
  ) {
    throw new Error(`Agent run ended with status ${terminalStatus}`);
  }

  return resultText || assistantText;
}

async function pollRun(
  apiKey: string,
  agentId: string,
  runId: string,
  onProgress?: ProgressCallback,
): Promise<string> {
  const terminal = new Set([
    'FINISHED',
    'SUCCEEDED',
    'COMPLETED',
    'ERROR',
    'FAILED',
    'CANCELLED',
    'EXPIRED',
  ]);

  for (let i = 0; i < 120; i++) {
    const run = await getRun(apiKey, agentId, runId);
    onProgress?.(statusLabel(run.status));
    if (terminal.has(run.status)) {
      if (
        ['ERROR', 'FAILED', 'CANCELLED', 'EXPIRED'].includes(run.status)
      ) {
        throw new Error(`Agent run ${run.status.toLowerCase()}`);
      }
      if (!run.result) throw new Error('Run finished with empty result');
      return run.result;
    }
    await sleep(2500);
  }
  throw new Error('Timed out waiting for agent run');
}

function statusLabel(status: string): string {
  switch (status) {
    case 'CREATING':
      return 'Provisioning cloud agent…';
    case 'RUNNING':
      return 'Researching and writing…';
    case 'FINISHED':
    case 'SUCCEEDED':
    case 'COMPLETED':
      return 'Finalizing lesson…';
    default:
      return status ? `Status: ${status}` : 'Working…';
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function extractJsonObject(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? text).trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) {
    throw new Error('No JSON object found in agent response');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

export function parseLessonPayload(raw: unknown): LessonPayload {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Lesson payload must be an object');
  }
  const obj = raw as Record<string, unknown>;
  const title = String(obj.title ?? '').trim();
  const topic = String(obj.topic ?? '').trim();
  const articleMarkdown = String(
    obj.articleMarkdown ?? obj.article ?? '',
  ).trim();
  const sources = Array.isArray(obj.sources)
    ? obj.sources.map((s) => String(s)).filter(Boolean)
    : [];
  const quizRaw = Array.isArray(obj.quiz) ? obj.quiz : [];

  if (!title || !articleMarkdown) {
    throw new Error('Lesson missing title or articleMarkdown');
  }

  const quiz: QuizQuestion[] = quizRaw.map((q, i) => {
    const item = q as Record<string, unknown>;
    const choices = Array.isArray(item.choices)
      ? item.choices.map((c) => String(c))
      : [];
    const correctIndex = Number(item.correctIndex);
    if (choices.length < 2 || Number.isNaN(correctIndex)) {
      throw new Error(`Invalid quiz question at index ${i}`);
    }
    return {
      question: String(item.question ?? '').trim(),
      choices,
      correctIndex,
      explanation: String(item.explanation ?? '').trim(),
    };
  });

  if (quiz.length < 1) {
    throw new Error('Lesson quiz is empty');
  }

  return { title, topic: topic || title, articleMarkdown, sources, quiz };
}

export async function runLessonAgent(
  apiKey: string,
  promptText: string,
  onProgress?: ProgressCallback,
  name?: string,
): Promise<LessonPayload> {
  onProgress?.('Creating cloud agent…');
  const created = await createNoRepoAgent(apiKey, promptText, name);
  const agentId = created.agent.id;
  const runId = created.run.id;

  let text: string;
  try {
    onProgress?.('Streaming agent progress…');
    text = await streamRun(apiKey, agentId, runId, onProgress);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    onProgress?.('Falling back to polling…');
    if (message === 'STREAM_EXPIRED' || message.includes('Stream failed')) {
      text = await pollRun(apiKey, agentId, runId, onProgress);
    } else {
      // Prefer poll if stream otherwise fails mid-flight
      try {
        text = await pollRun(apiKey, agentId, runId, onProgress);
      } catch {
        throw err;
      }
    }
  }

  if (!text?.trim()) {
    // Last chance poll for terminal result text
    text = await pollRun(apiKey, agentId, runId, onProgress);
  }

  onProgress?.('Parsing lesson JSON…');
  const parsed = extractJsonObject(text);
  return parseLessonPayload(parsed);
}

export function buildDailyLessonPrompt(opts: {
  interests: string[];
  pastTitles: string[];
}): string {
  const interests =
    opts.interests.length > 0
      ? opts.interests.join(', ')
      : 'science, history, technology';
  const avoid =
    opts.pastTitles.length > 0
      ? opts.pastTitles.slice(0, 40).map((t) => `- ${t}`).join('\n')
      : '(none yet)';

  return `You are Daily Learner, a no-repo research agent. Produce ONE short informative daily learning article and a quiz.

Interests to prefer: ${interests}
Avoid repeating these past titles:
${avoid}

Requirements:
- Pick a fresh, specific topic worth ~5–8 minutes of reading.
- Write ~400–700 words in clear Markdown (headings, short paragraphs).
- Cite 2–4 public web sources (full URLs) in sources[].
- Create exactly 5 multiple-choice questions. Each has 4 choices, one correctIndex (0-based), and a brief explanation.

CRITICAL: Reply with JSON ONLY. No markdown fences unless necessary. No commentary outside JSON.
Schema:
{
  "title": string,
  "topic": string,
  "articleMarkdown": string,
  "sources": string[],
  "quiz": [
    {
      "question": string,
      "choices": [string, string, string, string],
      "correctIndex": number,
      "explanation": string
    }
  ]
}`;
}

export function buildUrlLessonPrompt(opts: {
  url: string;
  title: string;
  text: string;
}): string {
  const truncated = opts.text.slice(0, 12000);
  return `You are Daily Learner. Turn the following article extract into a tight learning summary and quiz.

Source URL: ${opts.url}
Extracted title: ${opts.title || '(unknown)'}

ARTICLE TEXT:
"""
${truncated}
"""

Requirements:
- Write a concise informative summary in Markdown (~300–500 words) that a busy learner can finish quickly.
- Preserve key facts; do not invent details not supported by the extract.
- Create exactly 5 multiple-choice questions grounded in the extract (4 choices each, correctIndex 0-based, short explanation).
- Put the original URL in sources[].

CRITICAL: Reply with JSON ONLY matching:
{
  "title": string,
  "topic": string,
  "articleMarkdown": string,
  "sources": string[],
  "quiz": [
    {
      "question": string,
      "choices": [string, string, string, string],
      "correctIndex": number,
      "explanation": string
    }
  ]
}`;
}
