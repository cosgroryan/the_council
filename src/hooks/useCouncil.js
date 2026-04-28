import { useState, useCallback, useRef } from 'react';
import { DEFAULT_COUNCILLORS, CHAIRPERSON_SYSTEM_PROMPT, SYNTHESIZER_SYSTEM_PROMPT, parseSynthesizerOutput } from '../data/defaultCouncillors';

export const MODELS = [
  { id: 'claude-opus-4-7',           label: 'Opus 4.7',   description: 'Most capable' },
  { id: 'claude-sonnet-4-6',         label: 'Sonnet 4.6', description: 'Balanced' },
  { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5',  description: 'Fastest' },
];

const STORAGE_KEY   = 'council_councillors';
const MODEL_KEY     = 'council_model';
const DEFAULT_MODEL = 'claude-sonnet-4-6';

function loadCouncillors() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_COUNCILLORS;
}

function saveCouncillors(councillors) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(councillors)); } catch {}
}

function loadModel() {
  try {
    const saved = localStorage.getItem(MODEL_KEY);
    if (saved && MODELS.find(m => m.id === saved)) return saved;
  } catch {}
  return DEFAULT_MODEL;
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// messages: string (single-turn) or array of {role, content} (multi-turn)
async function callAPI(model, systemPrompt, messages) {
  const normalized = typeof messages === 'string'
    ? [{ role: 'user', content: messages }]
    : messages;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model, max_tokens: 1024, system: systemPrompt, messages: normalized }),
  });

  if (response.status === 429) {
    // Use the API's own reset timestamp if CORS exposes it, otherwise wait 30s
    const resetHeader = response.headers.get('anthropic-ratelimit-tokens-reset');
    let retryAfterMs = 30000;
    if (resetHeader) {
      retryAfterMs = Math.max(1000, new Date(resetHeader).getTime() - Date.now() + 500);
    }
    const err = new Error(`Rate limited — will retry after ${Math.round(retryAfterMs / 1000)}s`);
    err.status = 429;
    err.retryAfterMs = retryAfterMs;
    throw err;
  }

  if (!response.ok) {
    let errText = '';
    try { errText = await response.text(); } catch {}
    const err = new Error(`API error ${response.status}${errText ? ': ' + errText : ''}`);
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callAPIWithRetry(model, systemPrompt, messages, maxRetries = 3) {
  let lastErr;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await callAPI(model, systemPrompt, messages);
    } catch (err) {
      lastErr = err;
      if (err.status !== 429 || attempt === maxRetries - 1) throw err;
      // Wait for the exact reset time the API advertises, or 30s by default
      await sleep(err.retryAfterMs ?? 30000);
    }
  }
  throw lastErr;
}

export function useCouncil() {
  const [councillors, setCouncillors]             = useState(loadCouncillors);
  const [model, setModelState]                    = useState(loadModel);
  const [isLoading, setIsLoading]                 = useState(false);
  const [currentQuestion, setCurrentQuestion]     = useState('');
  const [councillorResponses, setCouncillorResponses] = useState({});
  const [chairpersonResponse, setChairpersonResponse] = useState(null);
  const [chairpersonReplies, setChairpersonReplies]   = useState([]);
  const [synthesis, setSynthesis]                 = useState(null);
  const [sessionLog, setSessionLog]               = useState([]);

  // Stores the full conversation so follow-ups have context
  const chairpersonThreadRef = useRef([]);

  const updateCouncillors = useCallback((next) => {
    setCouncillors(next);
    saveCouncillors(next);
  }, []);

  const addCouncillor = useCallback((councillor) => {
    updateCouncillors([...councillors, { id: `custom-${Date.now()}`, ...councillor }]);
  }, [councillors, updateCouncillors]);

  const updateCouncillor = useCallback((id, updates) => {
    updateCouncillors(councillors.map(c => c.id === id ? { ...c, ...updates } : c));
  }, [councillors, updateCouncillors]);

  const removeCouncillor = useCallback((id) => {
    if (councillors.length <= 1) return;
    updateCouncillors(councillors.filter(c => c.id !== id));
  }, [councillors, updateCouncillors]);

  const resetToDefaults = useCallback(() => {
    updateCouncillors(DEFAULT_COUNCILLORS);
  }, [updateCouncillors]);

  const setModel = useCallback((id) => {
    setModelState(id);
    try { localStorage.setItem(MODEL_KEY, id); } catch {}
  }, []);

  const submitQuestion = useCallback(async (question, attachedFiles = []) => {
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    setCurrentQuestion(question);
    setChairpersonResponse(null);
    setChairpersonReplies([]);
    setSynthesis({ status: 'loading' });
    chairpersonThreadRef.current = [];

    // active === false explicitly opts out; undefined/true both count as active
    // (handles councillors loaded from localStorage before the active field existed)
    const activeCouncillors = councillors.filter(c => c.active !== false);

    // --- Synthesizer step ---
    // Builds the raw input for the synthesizer: question + raw file content
    const rawFileBlock = attachedFiles.length > 0
      ? attachedFiles.map(f => `[${f.name}]\n${f.content}`).join('\n\n')
      : null;

    const synthInput = rawFileBlock
      ? `Question:\n${question}\n\nDocuments:\n${rawFileBlock}`
      : `Question:\n${question}`;

    let trimmedQuestion = question;
    let fileContext = null;

    try {
      const synthOutput = await callAPIWithRetry(model, SYNTHESIZER_SYSTEM_PROMPT, synthInput);
      const parsed = parseSynthesizerOutput(synthOutput);
      trimmedQuestion = parsed.trimmedQuestion || question;
      fileContext = parsed.fileContext;
      setSynthesis({ status: 'ready', trimmedQuestion, fileContext });
    } catch {
      // Synthesizer failed — fall back to original question, skip file content
      setSynthesis({ status: 'error', trimmedQuestion: question, fileContext: null });
    }

    const initial = {};
    activeCouncillors.forEach(c => { initial[c.id] = { status: 'waiting', content: '' }; });
    setCouncillorResponses(initial);

    // Build what each councillor receives: trimmed question + compact file context (no raw files)
    const councillorContent = [
      fileContext ? `Context:\n${fileContext}` : null,
      trimmedQuestion,
    ].filter(Boolean).join('\n\n');

    // Run sequentially to stay within per-minute token limits
    const results = [];
    for (const councillor of activeCouncillors) {
      try {
        const content = await callAPIWithRetry(model, councillor.systemPrompt, councillorContent);
        setCouncillorResponses(prev => ({ ...prev, [councillor.id]: { status: 'ready', content } }));
        results.push({ id: councillor.id, name: councillor.name, emoji: councillor.emoji, content, error: false });
      } catch (err) {
        const msg = err.message || 'Unknown error';
        setCouncillorResponses(prev => ({ ...prev, [councillor.id]: { status: 'error', content: msg } }));
        results.push({ id: councillor.id, name: councillor.name, emoji: councillor.emoji, content: msg, error: true });
      }
    }

    setChairpersonResponse({ status: 'loading', content: '' });

    const chairUserMessage = [
      `Original Question: ${question}`,
      attachedFiles.length > 0 ? `Attached files: ${attachedFiles.map(f => f.name).join(', ')}` : null,
      fileContext ? `Document context:\n${fileContext}` : null,
      '',
      '---',
      '',
      ...results.map(r => `${r.name} Assessment:\n${r.content}`),
    ].filter(Boolean).join('\n\n');

    try {
      const chairContent = await callAPIWithRetry(model, CHAIRPERSON_SYSTEM_PROMPT, chairUserMessage);
      setChairpersonResponse({ status: 'ready', content: chairContent });

      // Seed the thread for future follow-ups
      chairpersonThreadRef.current = [
        { role: 'user', content: chairUserMessage },
        { role: 'assistant', content: chairContent },
      ];

      setSessionLog(prev => [{
        id: Date.now(),
        question,
        timestamp: new Date(),
        results,
        councillorSnapshot: activeCouncillors.map(c => ({ id: c.id, name: c.name, emoji: c.emoji })),
        chairpersonContent: chairContent,
        attachedFiles: attachedFiles.map(f => ({ name: f.name, type: f.type, descriptor: f.descriptor })),
      }, ...prev]);
    } catch (err) {
      setChairpersonResponse({ status: 'error', content: err.message });
    }

    setIsLoading(false);
  }, [councillors, model, isLoading]);

  const askFollowUp = useCallback(async (question) => {
    if (!question.trim() || isLoading) return;

    const id = Date.now();
    setChairpersonReplies(prev => [...prev, { id, question, content: '', status: 'loading' }]);

    // Append user message to thread
    const updatedThread = [
      ...chairpersonThreadRef.current,
      { role: 'user', content: question },
    ];

    try {
      const content = await callAPIWithRetry(model, CHAIRPERSON_SYSTEM_PROMPT, updatedThread);
      chairpersonThreadRef.current = [...updatedThread, { role: 'assistant', content }];
      setChairpersonReplies(prev =>
        prev.map(r => r.id === id ? { ...r, content, status: 'ready' } : r)
      );
    } catch (err) {
      setChairpersonReplies(prev =>
        prev.map(r => r.id === id ? { ...r, content: err.message, status: 'error' } : r)
      );
    }
  }, [model, isLoading]);

  return {
    councillors,
    model,
    setModel,
    isLoading,
    synthesis,
    currentQuestion,
    councillorResponses,
    chairpersonResponse,
    chairpersonReplies,
    sessionLog,
    submitQuestion,
    askFollowUp,
    addCouncillor,
    updateCouncillor,
    removeCouncillor,
    resetToDefaults,
  };
}
