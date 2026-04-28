import { useState } from 'react';
import Markdown from 'react-markdown';

const FILE_ICONS = { pdf: '📄', docx: '📝', doc: '📝', xlsx: '📊', xls: '📊', csv: '📊', txt: '📃', md: '📃', json: '📋' };

function extractSummary(content) {
  if (!content) return '';
  const sentence = content.match(/^[^.!?\n]{10,}[.!?]/);
  if (sentence) return sentence[0].trim();
  const line = content.split('\n')[0];
  return line.length > 120 ? line.slice(0, 120) + '…' : line;
}

function formatDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === now.toDateString()) return time;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' · ' + time;
}

export default function SessionLog({ sessions, onContinue }) {
  const [expandedId, setExpandedId] = useState(null);

  if (sessions.length === 0) {
    return (
      <div className="text-center py-16 text-council-text-dim text-sm">
        No sessions yet. Convene the Council to begin.
      </div>
    );
  }

  const expanded = expandedId != null ? sessions.find(s => s.id === expandedId) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-council-text">Session Log</h2>
        <span className="text-xs text-council-text-muted">
          {sessions.length} session{sessions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {expanded ? (
        <SessionDetail session={expanded} onBack={() => setExpandedId(null)} onContinue={onContinue} />
      ) : (
        <div className="space-y-2">
          {sessions.map((session, i) => (
            <SessionCard
              key={session.id}
              session={session}
              number={sessions.length - i}
              onClick={() => setExpandedId(session.id)}
              onContinue={onContinue}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, number, onClick, onContinue }) {
  const summary = extractSummary(session.chairpersonContent);
  const date = formatDate(session.timestamp);

  return (
    <div className="bg-council-card border border-council-border rounded-xl hover:border-council-border-light transition-colors group">
      <button onClick={onClick} className="w-full text-left px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-council-text truncate">{session.question}</div>
            {summary && (
              <div className="text-xs text-council-text-dim mt-1 line-clamp-1 leading-relaxed">{summary}</div>
            )}
          </div>
          <span className="text-xs text-council-text-dim flex-shrink-0 mt-0.5">{date}</span>
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-council-text-dim">
          <span className="font-mono">#{number}</span>
          {session.attachedFiles?.length > 0 && (
            <span>📎 {session.attachedFiles.length} file{session.attachedFiles.length !== 1 ? 's' : ''}</span>
          )}
          {session.results?.length > 0 && (
            <span>{session.results.length} councillor{session.results.length !== 1 ? 's' : ''}</span>
          )}
          <span className="ml-auto text-council-text-dim/40 group-hover:text-council-accent/60 transition-colors text-[11px]">View →</span>
        </div>
      </button>
      {onContinue && (
        <div className="px-5 pb-3">
          <button
            onClick={() => onContinue(session)}
            className="text-xs text-council-accent/70 hover:text-council-accent transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 15l4-4m0 0l-4-4m4 4H3" />
            </svg>
            Continue from here
          </button>
        </div>
      )}
    </div>
  );
}

function SessionDetail({ session, onBack, onContinue }) {
  const [activeCouncillor, setActiveCouncillor] = useState(null);

  const formattedDate = new Date(session.timestamp).toLocaleString([], {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs text-council-text-dim hover:text-council-text transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          All sessions
        </button>
        {onContinue && (
          <button
            onClick={() => onContinue(session)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-council-accent/30 text-council-accent hover:bg-council-accent/10 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 15l4-4m0 0l-4-4m4 4H3" />
            </svg>
            Continue from here
          </button>
        )}
      </div>

      <div className="bg-council-card border border-council-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-council-border">
          <div className="text-xs text-council-text-dim mb-2">{formattedDate}</div>
          <div className="text-base font-semibold text-council-text">{session.question}</div>
        </div>

        {/* Attached files */}
        {session.attachedFiles?.length > 0 && (
          <div className="px-6 py-4 border-b border-council-border/50 bg-council-surface/30">
            <div className="text-xs text-council-text-dim uppercase tracking-widest mb-2">Context files</div>
            <div className="space-y-1">
              {session.attachedFiles.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-council-text-muted">
                  <span className="mt-0.5 flex-shrink-0">{FILE_ICONS[f.type] ?? '📎'}</span>
                  <span>{f.descriptor}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Councillor badges */}
        <div className="px-6 py-4 flex flex-wrap gap-2 border-b border-council-border/50">
          {session.results.map(r => {
            const snap = session.councillorSnapshot.find(c => c.id === r.id);
            return (
              <button
                key={r.id}
                onClick={() => setActiveCouncillor(activeCouncillor === r.id ? null : r.id)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  r.error
                    ? 'border-council-red/30 text-council-red/70'
                    : activeCouncillor === r.id
                      ? 'border-council-accent/50 text-council-accent bg-council-accent/10'
                      : 'border-council-border text-council-text-muted hover:border-council-border-light hover:text-council-text'
                }`}
              >
                <span>{snap?.emoji}</span>
                <span>{snap?.name}</span>
              </button>
            );
          })}
        </div>

        {/* Individual councillor output */}
        {activeCouncillor && (() => {
          const result = session.results.find(r => r.id === activeCouncillor);
          const snap = session.councillorSnapshot.find(c => c.id === activeCouncillor);
          if (!result) return null;
          return (
            <div className="px-6 py-4 border-b border-council-border/50 bg-council-surface/50">
              <div className="flex items-center gap-2 mb-3">
                <span>{snap?.emoji}</span>
                <span className="text-xs font-semibold text-council-text-muted uppercase tracking-widest">{snap?.name}</span>
              </div>
              <Markdown className="prose-council text-sm text-council-text leading-relaxed">{result.content}</Markdown>
            </div>
          );
        })()}

        {/* Chairperson synthesis */}
        {session.chairpersonContent && (
          <div className="px-6 py-5">
            <div className="text-xs font-semibold text-council-accent uppercase tracking-widest mb-3">
              Chairperson's Synthesis
            </div>
            <Markdown className="prose-council text-sm text-council-text leading-relaxed">{session.chairpersonContent}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}
