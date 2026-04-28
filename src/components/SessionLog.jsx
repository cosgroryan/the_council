import { useState } from 'react';

const FILE_ICONS = { pdf: '📄', doc: '📝', docx: '📝', xlsx: '📊', xls: '📊', csv: '📊' };

export default function SessionLog({ sessions }) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-16 text-council-text-dim text-sm">
        No sessions yet. Convene the Council to begin.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-council-text">Session Log</h2>
        <span className="text-xs text-council-text-muted">{sessions.length} session{sessions.length !== 1 ? 's' : ''} this run</span>
      </div>

      {sessions.map((session, index) => (
        <SessionEntry key={session.id} session={session} number={sessions.length - index} isFirst={index === 0} />
      ))}
    </div>
  );
}

function SessionEntry({ session, number, isFirst }) {
  const [isExpanded, setIsExpanded] = useState(isFirst);
  const [activeCouncillor, setActiveCouncillor] = useState(null);

  const formattedTime = new Date(session.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-council-card border border-council-border rounded-lg overflow-hidden">
      {/* Entry header */}
      <button
        onClick={() => setIsExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-council-card-hover transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs text-council-text-dim font-mono flex-shrink-0">#{number}</span>
          <span className="text-sm text-council-text truncate">{session.question}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          {session.attachedFiles?.length > 0 && (
            <span className="text-xs text-council-text-dim flex items-center gap-1">
              <span>📎</span>
              <span>{session.attachedFiles.length}</span>
            </span>
          )}
          <span className="text-xs text-council-text-dim">{formattedTime}</span>
          <svg
            className={`w-3.5 h-3.5 text-council-text-dim transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-council-border">
          {/* Attached files */}
          {session.attachedFiles?.length > 0 && (
            <div className="px-5 py-3 border-b border-council-border/50">
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
          <div className="px-5 py-3 flex flex-wrap gap-2 border-b border-council-border/50">
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
              <div className="px-5 py-4 border-b border-council-border/50 bg-council-surface/50">
                <div className="flex items-center gap-2 mb-3">
                  <span>{snap?.emoji}</span>
                  <span className="text-xs font-semibold text-council-text-muted uppercase tracking-widest">{snap?.name}</span>
                </div>
                <p className="text-sm text-council-text leading-relaxed whitespace-pre-wrap">{result.content}</p>
              </div>
            );
          })()}

          {/* Chairperson synthesis */}
          {session.chairpersonContent && (
            <div className="px-5 py-4">
              <div className="text-xs font-semibold text-council-accent uppercase tracking-widest mb-3">
                Chairperson's Synthesis
              </div>
              <p className="text-sm text-council-text leading-relaxed whitespace-pre-wrap">
                {session.chairpersonContent}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
