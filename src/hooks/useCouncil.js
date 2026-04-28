import { useState, useCallback, useRef, useEffect } from 'react';
import { DEFAULT_COUNCILLORS, CHAIRPERSON_SYSTEM_PROMPT, SYNTHESIZER_SYSTEM_PROMPT, parseSynthesizerOutput } from '../data/defaultCouncillors';
import { supabase } from '../lib/supabase';

export const MODELS = [
  { id: 'claude-opus-4-7',           label: 'Opus 4.7',   description: 'Most capable' },
  { id: 'claude-sonnet-4-6',         label: 'Sonnet 4.6', description: 'Balanced' },
  { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5',  description: 'Fastest' },
];

const MODEL_KEY = 'council_model';

function loadModel() {
  try {
    const s = localStorage.getItem(MODEL_KEY);
    if (s) return s;
  } catch {}
  return 'claude-sonnet-4-6';
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function callAPI(apiKey, model, systemPrompt, messages) {
  const normalized = typeof messages === 'string'
    ? [{ role: 'user', content: messages }]
    : messages;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model, max_tokens: 1024, system: systemPrompt, messages: normalized }),
  });

  if (response.status === 429) {
    const resetHeader = response.headers.get('anthropic-ratelimit-tokens-reset');
    let retryAfterMs = 30000;
    if (resetHeader) retryAfterMs = Math.max(1000, new Date(resetHeader).getTime() - Date.now() + 500);
    const err = new Error(`Rate limited — will retry after ${Math.round(retryAfterMs / 1000)}s`);
    err.status = 429; err.retryAfterMs = retryAfterMs;
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

async function callAPIWithRetry(apiKey, model, systemPrompt, messages, maxRetries = 3) {
  let lastErr;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await callAPI(apiKey, model, systemPrompt, messages);
    } catch (err) {
      lastErr = err;
      if (err.status !== 429 || attempt === maxRetries - 1) throw err;
      await sleep(err.retryAfterMs ?? 30000);
    }
  }
  throw lastErr;
}

/* ── DB helpers ─────────────────────────────────────────────── */

function toDbRow(userId, councillor, sortOrder) {
  return {
    user_id:       userId,
    councillor_id: councillor.id,
    name:          councillor.name,
    emoji:         councillor.emoji,
    system_prompt: councillor.systemPrompt,
    active:        councillor.active !== false,
    sort_order:    sortOrder,
  };
}

function fromDbRow(row) {
  return {
    id:           row.councillor_id,
    name:         row.name,
    emoji:        row.emoji,
    systemPrompt: row.system_prompt,
    active:       row.active,
  };
}

async function upsertCouncillors(userId, councillors) {
  const rows = councillors.map((c, i) => toDbRow(userId, c, i));
  await supabase.from('councillors').upsert(rows, { onConflict: 'user_id,councillor_id' });
}

async function deleteCouncillor(userId, councillorId) {
  await supabase.from('councillors').delete()
    .eq('user_id', userId).eq('councillor_id', councillorId);
}

/* ── Hook ────────────────────────────────────────────────────── */

export function useCouncil({ user, apiKey }) {
  const [councillors, setCouncillors]                 = useState([]);
  const [model, setModelState]                        = useState(loadModel);
  const [isLoading, setIsLoading]                     = useState(false);
  const [currentQuestion, setCurrentQuestion]         = useState('');
  const [councillorResponses, setCouncillorResponses] = useState({});
  const [chairpersonResponse, setChairpersonResponse] = useState(null);
  const [chairpersonReplies, setChairpersonReplies]   = useState([]);
  const [synthesis, setSynthesis]                     = useState(null);
  const [sessionLog, setSessionLog]                   = useState([]);

  const chairpersonThreadRef = useRef([]);

  // ── Load councillors from DB ──────────────────────────────────
  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data, error } = await supabase
        .from('councillors').select().eq('user_id', user.id).order('sort_order');

      if (!error && data && data.length > 0) {
        setCouncillors(data.map(fromDbRow));
      } else {
        // First time: seed with defaults
        const defaults = DEFAULT_COUNCILLORS;
        setCouncillors(defaults);
        await upsertCouncillors(user.id, defaults);
      }
    }
    load();
  }, [user?.id]);

  // ── Load sessions from DB ─────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data, error } = await supabase
        .from('sessions').select().eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setSessionLog(data.map(s => ({
          id: s.id,
          question: s.question,
          timestamp: new Date(s.created_at),
          results: s.results,
          councillorSnapshot: s.councillor_snapshot,
          chairpersonContent: s.chairperson_content,
          attachedFiles: s.attached_files,
        })));
      }
    }
    load();
  }, [user?.id]);

  const setModel = useCallback((id) => {
    setModelState(id);
    try { localStorage.setItem(MODEL_KEY, id); } catch {}
  }, []);

  // ── Councillor management ─────────────────────────────────────
  const addCouncillor = useCallback(async (councillor) => {
    const next = [...councillors, councillor];
    setCouncillors(next);
    if (user) await upsertCouncillors(user.id, next);
  }, [councillors, user]);

  const updateCouncillor = useCallback(async (id, updates) => {
    const next = councillors.map(c => c.id === id ? { ...c, ...updates } : c);
    setCouncillors(next);
    if (user) await upsertCouncillors(user.id, next);
  }, [councillors, user]);

  const removeCouncillor = useCallback(async (id) => {
    if (councillors.length <= 1) return;
    const next = councillors.filter(c => c.id !== id);
    setCouncillors(next);
    if (user) await deleteCouncillor(user.id, id);
  }, [councillors, user]);

  const resetToDefaults = useCallback(async () => {
    setCouncillors(DEFAULT_COUNCILLORS);
    if (user) {
      await supabase.from('councillors').delete().eq('user_id', user.id);
      await upsertCouncillors(user.id, DEFAULT_COUNCILLORS);
    }
  }, [user]);

  // ── Submit question ───────────────────────────────────────────
  const submitQuestion = useCallback(async (question, attachedFiles = [], priorSession = null) => {
    if (!question.trim() || isLoading || !apiKey) return;

    setIsLoading(true);
    setCurrentQuestion(question);
    setChairpersonResponse(null);
    setChairpersonReplies([]);
    setSynthesis({ status: 'loading' });
    chairpersonThreadRef.current = [];

    const activeCouncillors = councillors.filter(c => c.active !== false);

    const priorBlock = priorSession
      ? `[PRIOR SESSION]\nQuestion: ${priorSession.question}\nCouncil synthesis: ${priorSession.chairpersonContent}\n[END PRIOR SESSION]`
      : null;

    const rawFileBlock = attachedFiles.length > 0
      ? attachedFiles.map(f => `[${f.name}]\n${f.content}`).join('\n\n')
      : null;

    const synthParts = [
      priorBlock ? `Prior session context:\n${priorBlock}` : null,
      `Question:\n${question}`,
      rawFileBlock ? `Documents:\n${rawFileBlock}` : null,
    ].filter(Boolean);

    const synthInput = synthParts.join('\n\n');

    let trimmedQuestion = question;
    let fileContext = null;

    try {
      const synthOutput = await callAPIWithRetry(apiKey, model, SYNTHESIZER_SYSTEM_PROMPT, synthInput);
      const parsed = parseSynthesizerOutput(synthOutput);
      trimmedQuestion = parsed.trimmedQuestion || question;
      fileContext = parsed.fileContext;
      setSynthesis({ status: 'ready', trimmedQuestion, fileContext });
    } catch {
      setSynthesis({ status: 'error', trimmedQuestion: question, fileContext: null });
    }

    const initial = {};
    activeCouncillors.forEach(c => { initial[c.id] = { status: 'waiting', content: '' }; });
    setCouncillorResponses(initial);

    const councillorContent = [
      priorBlock ? `Prior session context:\n${priorBlock}` : null,
      fileContext ? `Context:\n${fileContext}` : null,
      trimmedQuestion,
    ].filter(Boolean).join('\n\n');

    const results = [];
    for (const councillor of activeCouncillors) {
      try {
        const content = await callAPIWithRetry(apiKey, model, councillor.systemPrompt, councillorContent);
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
      const chairContent = await callAPIWithRetry(apiKey, model, CHAIRPERSON_SYSTEM_PROMPT, chairUserMessage);
      setChairpersonResponse({ status: 'ready', content: chairContent });

      chairpersonThreadRef.current = [
        { role: 'user', content: chairUserMessage },
        { role: 'assistant', content: chairContent },
      ];

      // Persist session to DB
      const sessionPayload = {
        question,
        councillor_snapshot: activeCouncillors.map(c => ({ id: c.id, name: c.name, emoji: c.emoji })),
        results,
        chairperson_content: chairContent,
        attached_files: attachedFiles.map(f => ({ name: f.name, type: f.type, descriptor: f.descriptor })),
      };

      const newLogEntry = {
        id: Date.now(),
        question,
        timestamp: new Date(),
        results,
        councillorSnapshot: sessionPayload.councillor_snapshot,
        chairpersonContent: chairContent,
        attachedFiles: sessionPayload.attached_files,
      };

      if (user) {
        const { data: inserted } = await supabase
          .from('sessions').insert({ user_id: user.id, ...sessionPayload }).select('id').single();
        if (inserted) newLogEntry.id = inserted.id;
      }

      setSessionLog(prev => [newLogEntry, ...prev]);
    } catch (err) {
      setChairpersonResponse({ status: 'error', content: err.message });
    }

    setIsLoading(false);
  }, [councillors, model, isLoading, apiKey, user]);

  // ── Follow-up reply ───────────────────────────────────────────
  const askFollowUp = useCallback(async (question) => {
    if (!question.trim() || isLoading || !apiKey) return;

    const id = Date.now();
    setChairpersonReplies(prev => [...prev, { id, question, content: '', status: 'loading' }]);

    const updatedThread = [
      ...chairpersonThreadRef.current,
      { role: 'user', content: question },
    ];

    try {
      const content = await callAPIWithRetry(apiKey, model, CHAIRPERSON_SYSTEM_PROMPT, updatedThread);
      chairpersonThreadRef.current = [...updatedThread, { role: 'assistant', content }];
      setChairpersonReplies(prev => prev.map(r => r.id === id ? { ...r, content, status: 'ready' } : r));
    } catch (err) {
      setChairpersonReplies(prev => prev.map(r => r.id === id ? { ...r, content: err.message, status: 'error' } : r));
    }
  }, [model, isLoading, apiKey]);

  const clearSession = useCallback(() => {
    setCouncillorResponses({});
    setChairpersonResponse(null);
    setChairpersonReplies([]);
    setSynthesis(null);
    chairpersonThreadRef.current = [];
  }, []);

  return {
    councillors, model, setModel, isLoading, synthesis,
    currentQuestion, councillorResponses, chairpersonResponse,
    chairpersonReplies, sessionLog, submitQuestion, askFollowUp,
    addCouncillor, updateCouncillor, removeCouncillor, resetToDefaults,
    clearSession,
  };
}
