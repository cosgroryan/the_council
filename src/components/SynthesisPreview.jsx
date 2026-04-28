import { useState } from 'react';

export default function SynthesisPreview({ synthesis }) {
  const [expanded, setExpanded] = useState(false);

  if (!synthesis) return null;

  if (synthesis.status === 'loading') {
    return (
      <div className="flex items-center gap-2.5 text-xs text-council-text-muted px-1">
        <Spinner className="w-3 h-3" />
        Analysing input…
      </div>
    );
  }

  if (synthesis.status === 'error') {
    return (
      <div className="text-xs text-council-text-dim px-1">
        Synthesizer unavailable — using original input.
      </div>
    );
  }

  const hasContext = !!synthesis.fileContext;

  return (
    <div className="border border-council-border rounded-lg overflow-hidden text-xs">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-council-surface/60 transition-colors text-left"
      >
        <span className="flex items-center gap-2 text-council-text-dim">
          <svg className="w-3 h-3 text-council-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Input processed
          {hasContext && <span className="text-council-text-dim/60">· files extracted</span>}
        </span>
        <svg
          className={`w-3 h-3 text-council-text-dim transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-council-border divide-y divide-council-border/50">
          <div className="px-4 py-3 space-y-1">
            <div className="text-council-text-dim uppercase tracking-widest mb-2">Trimmed question</div>
            <p className="text-council-text-muted leading-relaxed">{synthesis.trimmedQuestion}</p>
          </div>
          {hasContext && (
            <div className="px-4 py-3 space-y-1">
              <div className="text-council-text-dim uppercase tracking-widest mb-2">Extracted file context</div>
              <p className="text-council-text-muted leading-relaxed whitespace-pre-wrap">{synthesis.fileContext}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Spinner({ className }) {
  return (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
