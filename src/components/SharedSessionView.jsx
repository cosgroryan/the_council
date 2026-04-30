import { useEffect, useState } from 'react';
import Markdown from './Markdown';
import { supabase } from '../lib/supabase';
import { exportSessionPDF } from '../lib/exportPDF.jsx';

export default function SharedSessionView({ token }) {
  const [session, setSession] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [activeCouncillor, setActiveCouncillor] = useState(null); // null = chairperson view
  const [exporting, setExporting] = useState(false);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const root = document.documentElement;
    const prev = root.getAttribute('data-theme');
    root.setAttribute('data-theme', theme);
    return () => { if (prev) root.setAttribute('data-theme', prev); };
  }, [theme]);

  useEffect(() => {
    async function load() {
      const { data: share } = await supabase
        .from('shared_sessions')
        .select('session_id')
        .eq('share_token', token)
        .maybeSingle();

      if (!share) { setNotFound(true); return; }

      const { data: sess } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', share.session_id)
        .maybeSingle();

      if (!sess) { setNotFound(true); return; }

      setSession({
        id: sess.id,
        question: sess.question,
        condensedQuestion: sess.condensed_question || sess.question,
        timestamp: sess.created_at,
        results: sess.results ?? [],
        councillorSnapshot: sess.councillor_snapshot ?? [],
        chairpersonContent: sess.chairperson_content,
      });
    }
    load();
  }, [token]);

  async function handleExport() {
    if (!session || exporting) return;
    setExporting(true);
    try { await exportSessionPDF(session); } finally { setExporting(false); }
  }

  const formattedDate = session
    ? new Date(session.timestamp).toLocaleString([], {
        month: 'long', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '';

  const displayQuestion = session?.condensedQuestion || session?.question || '';
  const activeResult = activeCouncillor ? session?.results.find(r => r.id === activeCouncillor) : null;
  const activeSnap   = activeCouncillor ? session?.councillorSnapshot.find(c => c.id === activeCouncillor) : null;

  return (
    <div className="min-h-screen bg-council-bg">
      {/* Header */}
      <header className="border-b border-council-border bg-council-surface px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="The Council" className="w-7 h-7" />
            <span className="text-sm font-semibold text-council-text">The Council</span>
            <span className="text-xs text-council-text-dim">· Shared session</span>
          </div>
          <div className="flex items-center gap-2">
            {session && (
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-council-border text-council-text-muted hover:text-council-text hover:border-council-border-light transition-colors disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                {exporting ? 'Exporting…' : 'Export PDF'}
              </button>
            )}
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-lg border border-council-border text-council-text-muted hover:text-council-text hover:border-council-border-light transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {!session && !notFound && (
          <div className="text-center py-20 text-council-text-dim text-sm">Loading…</div>
        )}

        {notFound && (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">⚖️</div>
            <div className="text-council-text font-semibold mb-2">Session not found</div>
            <div className="text-council-text-dim text-sm">This link may have expired or been revoked.</div>
          </div>
        )}

        {session && (
          <div className="bg-council-card border border-council-border rounded-xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-council-border">
              <div className="text-xs text-council-text-dim mb-2">{formattedDate}</div>
              <div className="text-base font-semibold text-council-text">{displayQuestion}</div>
            </div>

            {/* Councillor badges */}
            <div className="px-6 py-4 flex flex-wrap gap-2 border-b border-council-border/50">
              {/* Chairperson badge — always first, active by default */}
              <button
                onClick={() => setActiveCouncillor(null)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  activeCouncillor === null
                    ? 'border-council-accent/50 text-council-accent bg-council-accent/10'
                    : 'border-council-border text-council-text-muted hover:border-council-border-light hover:text-council-text'
                }`}
              >
                <span>⚖️</span>
                <span>Chairperson</span>
              </button>

              {session.results.map(r => {
                const snap = session.councillorSnapshot.find(c => c.id === r.id);
                return (
                  <button
                    key={r.id}
                    onClick={() => setActiveCouncillor(r.id)}
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

            {/* Content: councillor or chairperson */}
            {activeCouncillor && activeResult ? (
              <div className="px-6 py-5">
                <div className="flex items-center gap-2 mb-3">
                  <span>{activeSnap?.emoji}</span>
                  <span className="text-xs font-semibold text-council-text-muted uppercase tracking-widest">{activeSnap?.name}</span>
                </div>
                <Markdown text={activeResult.content} />
              </div>
            ) : (
              session.chairpersonContent && (
                <div className="px-6 py-5">
                  <div className="text-xs font-semibold text-council-accent uppercase tracking-widest mb-3">
                    Chairperson's Synthesis
                  </div>
                  <Markdown text={session.chairpersonContent} />
                </div>
              )
            )}
          </div>
        )}
      </main>
    </div>
  );
}
