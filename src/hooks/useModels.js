import { useState, useEffect } from 'react';

export const FALLBACK_MODELS = [
  { id: 'claude-opus-4-7',           label: 'Opus 4.7',   description: 'Most capable' },
  { id: 'claude-sonnet-4-6',         label: 'Sonnet 4.6', description: 'Balanced' },
  { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5',  description: 'Fastest' },
];

function descriptionFor(name) {
  if (/opus/i.test(name))   return 'Most capable';
  if (/sonnet/i.test(name)) return 'Balanced';
  if (/haiku/i.test(name))  return 'Fastest';
  return '';
}

function parseModel(m) {
  const display = m.display_name || m.id;
  const label = display.replace(/^Claude\s+/i, '');
  return { id: m.id, label, description: descriptionFor(display) };
}

export function useModels(apiKey) {
  const [models, setModels] = useState(FALLBACK_MODELS);

  useEffect(() => {
    if (!apiKey) return;

    fetch('https://api.anthropic.com/v1/models?limit=100', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.data?.length) return;
        const list = data.data
          .filter(m => /^claude-/i.test(m.id))
          .map(parseModel);
        if (list.length) setModels(list);
      })
      .catch(() => {}); // silently fall back to FALLBACK_MODELS
  }, [apiKey]);

  return models;
}
