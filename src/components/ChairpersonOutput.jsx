import { useState, useRef, useEffect } from 'react';
import Markdown from './Markdown';

export default function ChairpersonOutput({ response, replies = [], onReply, sessionCount }) {
  if (!response) return null;

  return (
    <section className="animate-fade-in space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-council-accent uppercase tracking-widest">
            Chairperson's Synthesis
          </span>
          {sessionCount > 0 && (
            <div className="text-xs text-council-text-dim mt-1">Session #{sessionCount}</div>
          )}
        </div>
        {response.status === 'loading' && (
          <div className="flex items-center gap-2 text-xs text-council-text-muted">
            <Spinner className="w-3.5 h-3.5" />
            Synthesising
          </div>
        )}
        {response.status === 'ready' && (
          <span className="flex items-center gap-1.5 text-xs text-council-green">
            <span className="w-1.5 h-1.5 rounded-full bg-council-green" />
            Complete
          </span>
        )}
      </div>

      <div className="bg-council-card border border-council-border rounded-lg overflow-hidden">
        {response.status === 'loading' && (
          <div className="px-6 py-8 flex items-center gap-3 text-council-text-muted">
            <Spinner className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">The Chairperson is reviewing all assessments...</span>
          </div>
        )}

        {response.status === 'ready' && (
          <>
            <ParsedSynthesis text={response.content} />

            {/* Follow-up thread */}
            {replies.length > 0 && (
              <div className="border-t border-council-border divide-y divide-council-border/50">
                {replies.map(reply => (
                  <ReplyEntry key={reply.id} reply={reply} />
                ))}
              </div>
            )}

            {/* Reply input */}
            {onReply && <ReplyInput onReply={onReply} />}
          </>
        )}

        {response.status === 'error' && (
          <div className="px-6 py-5 text-sm text-council-red">
            <span className="font-medium">Synthesis failed: </span>
            {response.content}
          </div>
        )}
      </div>
    </section>
  );
}

function ReplyEntry({ reply }) {
  return (
    <div className="px-6 py-5 space-y-4">
      {/* User question */}
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 rounded-full bg-council-border-light flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-2.5 h-2.5 text-council-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <p className="text-sm text-council-text-muted leading-relaxed">{reply.question}</p>
      </div>

      {/* Chairperson reply */}
      {reply.status === 'loading' && (
        <div className="flex items-center gap-2 pl-8 text-council-text-muted text-sm">
          <Spinner className="w-3.5 h-3.5" />
          <span>Chairperson is responding...</span>
        </div>
      )}
      {reply.status === 'ready' && (
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-council-accent/20 border border-council-accent/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-council-accent text-xs font-bold leading-none">C</span>
          </div>
          <Markdown text={reply.content} />
        </div>
      )}
      {reply.status === 'error' && (
        <div className="pl-8 text-sm text-council-red">{reply.content}</div>
      )}
    </div>
  );
}

function ReplyInput({ onReply }) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim()) return;
    onReply(value.trim());
    setValue('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e);
  }

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <div className={`border-t transition-colors ${isFocused ? 'border-council-border-light' : 'border-council-border'}`}>
      <form onSubmit={handleSubmit} className="flex items-end gap-3 px-5 py-3">
        <div className="w-5 h-5 rounded-full bg-council-accent/20 border border-council-accent/30 flex items-center justify-center flex-shrink-0 mb-0.5">
          <span className="text-council-accent text-xs font-bold leading-none">C</span>
        </div>
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Ask the Chairperson a follow-up…"
          className="flex-1 bg-transparent text-sm text-council-text placeholder:text-council-text-dim resize-none focus:outline-none leading-relaxed py-0.5 min-h-[1.5rem] max-h-40 overflow-y-auto"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="flex-shrink-0 p-1.5 text-council-accent hover:text-council-accent-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed mb-0.5"
          title="Send (⌘+Enter)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </form>
    </div>
  );
}

function ParsedSynthesis({ text }) {
  const sections = parseSections(text);

  if (sections.length === 0) {
    return <div className="px-6 py-5"><Markdown text={text} /></div>;
  }

  const consensus      = sections.find(s => s.key === 'consensus');
  const tensions       = sections.find(s => s.key === 'tensions');
  const risks          = sections.find(s => s.key === 'risks');
  const recommendation = sections.find(s => s.key === 'recommendation');
  const unparsed       = sections.find(s => s.key === 'unparsed');

  return (
    <div>
      {(consensus || tensions) && (
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-council-border">
          {consensus && <SectionBlock icon={<ConsensusIcon />} label="Points of Consensus" text={consensus.content} />}
          {tensions  && <SectionBlock icon={<TensionsIcon />}  label="Key Tensions"         text={tensions.content} />}
        </div>
      )}
      {risks && (
        <div className="border-t border-council-border">
          <SectionBlock icon={<RisksIcon />} label="Critical Risks" text={risks.content} accent />
        </div>
      )}
      {recommendation && (
        <div className="border-t border-council-border">
          <SectionBlock icon={<RecommendationIcon />} label="Recommendation" text={recommendation.content} highlight />
        </div>
      )}
      {unparsed && (
        <div className="border-t border-council-border px-6 py-5">
          <Markdown text={unparsed.content} />
        </div>
      )}
    </div>
  );
}

function SectionBlock({ icon, label, text, accent, highlight }) {
  return (
    <div className={`px-6 py-5 ${highlight ? 'bg-council-accent/5' : ''}`}>
      <div className={`flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-widest ${
        highlight ? 'text-council-accent' : accent ? 'text-council-red/80' : 'text-council-text-muted'
      }`}>
        {icon}{label}
      </div>
      <Markdown text={text} />
    </div>
  );
}

function parseSections(text) {
  const PATTERNS = [
    { re: /consensus/i,      key: 'consensus' },
    { re: /tension/i,        key: 'tensions' },
    { re: /risk/i,           key: 'risks' },
    { re: /recommendation/i, key: 'recommendation' },
  ];

  const lines = text.split('\n');
  const sections = [];
  let currentKey = null;
  let currentLines = [];

  function flush() {
    if (currentKey && currentLines.length) {
      sections.push({ key: currentKey, content: currentLines.join('\n').trim() });
    }
  }

  for (const line of lines) {
    const stripped = line.replace(/[*_#`]/g, '').trim();
    const isHeader =
      stripped.length > 0 &&
      stripped.length < 70 &&
      (stripped.match(/^\d+\./) || stripped === stripped.toUpperCase()) &&
      PATTERNS.some(p => p.re.test(stripped));

    if (isHeader) {
      flush();
      currentKey = PATTERNS.find(p => p.re.test(stripped)).key;
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  flush();
  return sections;
}

function ConsensusIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function TensionsIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  );
}
function RisksIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
function RecommendationIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
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
