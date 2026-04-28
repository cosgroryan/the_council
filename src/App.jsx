import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './hooks/useAuth.jsx';
import { useCouncil } from './hooks/useCouncil';
import { useModels } from './hooks/useModels';
import AuthScreen from './components/AuthScreen';
import UnlockScreen from './components/UnlockScreen';
import AccountView from './components/AccountView';
import QuestionInput from './components/QuestionInput';
import CouncillorCard from './components/CouncillorCard';
import CouncillorDrawer from './components/CouncillorDrawer';
import ChairpersonOutput from './components/ChairpersonOutput';
import CouncillorEditor from './components/CouncillorEditor';
import SessionLog from './components/SessionLog';
import SynthesisPreview from './components/SynthesisPreview';

const VIEWS = {
  CHAMBER:     'chamber',
  SESSION_LOG: 'session-log',
  PERSONAS:    'personas',
  ACCOUNT:     'account',
};

const THEME_KEY = 'council_theme';

function loadTheme() {
  try { return localStorage.getItem(THEME_KEY) || 'dark'; } catch { return 'dark'; }
}

export default function App() {
  const { user, profile, apiKey, loading } = useAuth();
  const [theme, setTheme]                 = useState(loadTheme);

  const isInApp = !loading && !!user && !!apiKey;

  useEffect(() => {
    // Auth and unlock screens are always light mode
    document.documentElement.setAttribute('data-theme', isInApp ? theme : 'light');
    if (isInApp) {
      try { localStorage.setItem(THEME_KEY, theme); } catch {}
    }
  }, [isInApp, theme]);

  // Loading auth state
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-council-bg">
        <div className="text-council-text-dim text-sm">Loading…</div>
      </div>
    );
  }

  // Not logged in
  if (!user) return <AuthScreen />;

  // Logged in but API key not in session storage (tab was closed/reopened)
  if (!apiKey) return <UnlockScreen />;

  return <Chamber theme={theme} onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} />;
}

function Chamber({ theme, onToggleTheme }) {
  const { user, profile, apiKey } = useAuth();
  const council = useCouncil({ user, apiKey });
  const models = useModels(apiKey);

  const [view, setView]                       = useState(VIEWS.CHAMBER);
  const [activeCouncillorId, setActiveCouncillorId] = useState(null);
  const [sidebarOpen, setSidebarOpen]         = useState(false);
  const [priorSession, setPriorSession]       = useState(null);

  const activeCouncillor = council.councillors.find(c => c.id === activeCouncillorId) ?? null;

  function handleNewInquiry() {
    setPriorSession(null);
    setView(VIEWS.CHAMBER);
    setSidebarOpen(false);
  }

  function handleContinueSession(session) {
    setPriorSession(session);
    setView(VIEWS.CHAMBER);
    setSidebarOpen(false);
  }

  return (
    <div className="flex h-screen bg-council-bg overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:relative inset-y-0 left-0 z-30 w-56 flex flex-col bg-council-surface border-r border-council-border flex-shrink-0 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-council-border">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="The Council" className="w-8 h-8 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-council-text">The Council</div>
              <div className="text-xs text-council-text-dim">
                {council.isLoading ? 'Deliberating…' : `${council.councillors.filter(c => c.active !== false).length} active`}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <NavItem icon={<ChamberIcon />} label="Chamber"
            active={view === VIEWS.CHAMBER}
            onClick={() => { setView(VIEWS.CHAMBER); setSidebarOpen(false); }} />
          <NavItem icon={<LogIcon />} label="Session Log"
            active={view === VIEWS.SESSION_LOG}
            badge={council.sessionLog.length > 0 ? council.sessionLog.length : null}
            onClick={() => { setView(VIEWS.SESSION_LOG); setSidebarOpen(false); }} />
          <NavItem icon={<PersonasIcon />} label="Personas"
            active={view === VIEWS.PERSONAS}
            onClick={() => { setView(VIEWS.PERSONAS); setSidebarOpen(false); }} />

          {/* Theme toggle */}
          <div className="pt-2 mt-2 border-t border-council-border">
            <button
              onClick={onToggleTheme}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-council-text-muted hover:text-council-text hover:bg-council-card/50 transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </span>
              <span className="flex-1">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
              <span className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${
                theme === 'light' ? 'bg-council-accent' : 'bg-council-border-light'
              }`}>
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                  theme === 'light' ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </span>
            </button>
          </div>
        </nav>

        {/* Bottom: model picker + account + new inquiry */}
        <div className="px-3 py-4 border-t border-council-border space-y-3">
          <div>
            <div className="text-xs text-council-text-dim uppercase tracking-widest px-1 mb-1.5">Model</div>
            <ModelPicker models={models} selected={council.model} onSelect={council.setModel} disabled={council.isLoading} />
          </div>

          {/* Account button */}
          <button
            onClick={() => { setView(VIEWS.ACCOUNT); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
              view === VIEWS.ACCOUNT
                ? 'bg-council-card border border-council-border text-council-text'
                : 'text-council-text-dim hover:text-council-text hover:bg-council-card/50'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-council-accent/20 border border-council-accent/30 flex items-center justify-center flex-shrink-0">
              <span className="text-council-accent text-[9px] font-bold">
                {(profile?.name ?? 'U')[0].toUpperCase()}
              </span>
            </div>
            <span className="flex-1 text-left truncate">{profile?.name ?? 'Account'}</span>
          </button>

          <button
            onClick={handleNewInquiry}
            className="w-full px-4 py-2.5 bg-council-accent text-council-bg text-sm font-semibold rounded-lg hover:bg-council-accent-light transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Inquiry
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-council-border flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 text-council-text-muted hover:text-council-text transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-medium text-council-text">The Council</span>
          <div className="w-8" />
        </div>

        <main className="flex-1 overflow-y-auto">
          {view === VIEWS.CHAMBER && (
            <ChamberView council={council} onCardClick={setActiveCouncillorId} priorSession={priorSession} onClearPrior={() => setPriorSession(null)} />
          )}
          {view === VIEWS.SESSION_LOG && (
            <div className="max-w-4xl mx-auto px-6 py-8">
              <SessionLog sessions={council.sessionLog} onContinue={handleContinueSession} />
            </div>
          )}
          {view === VIEWS.PERSONAS && (
            <div className="max-w-4xl mx-auto px-6 py-8">
              <CouncillorEditor
                councillors={council.councillors}
                onAdd={council.addCouncillor}
                onUpdate={council.updateCouncillor}
                onRemove={council.removeCouncillor}
                onReset={council.resetToDefaults}
              />
            </div>
          )}
          {view === VIEWS.ACCOUNT && <AccountView />}
        </main>
      </div>

      <CouncillorDrawer
        councillor={activeCouncillor}
        response={activeCouncillorId ? council.councillorResponses[activeCouncillorId] : null}
        onClose={() => setActiveCouncillorId(null)}
      />
    </div>
  );
}

function ChamberView({ council, onCardClick, priorSession, onClearPrior }) {
  const activeCouncillors = council.councillors.filter(c => c.active !== false);

  function handleSubmit(question, files) {
    council.submitQuestion(question, files, priorSession ?? null);
    if (priorSession) onClearPrior();
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div>
        <div className="text-xs text-council-text-dim uppercase tracking-widest mb-1">Chamber Dashboard</div>
        <div className="text-xs text-council-text-muted uppercase tracking-widest">Strategic Inquiry</div>
      </div>

      {priorSession && (
        <div className="flex items-start gap-3 px-4 py-3 bg-council-surface border border-council-border rounded-xl text-xs">
          <span className="text-council-accent mt-0.5">↩</span>
          <div className="flex-1 min-w-0">
            <div className="text-council-text-dim uppercase tracking-widest mb-0.5">Continuing from</div>
            <div className="text-council-text truncate font-medium">{priorSession.question}</div>
          </div>
          <button onClick={onClearPrior} className="text-council-text-dim hover:text-council-text transition-colors flex-shrink-0">✕</button>
        </div>
      )}

      <QuestionInput onSubmit={handleSubmit} isLoading={council.isLoading} />
      <SynthesisPreview synthesis={council.synthesis} />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-council-text">The Assembly</h2>
          <span className="text-xs text-council-text-dim">
            {activeCouncillors.length} councillor{activeCouncillors.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {activeCouncillors.map(councillor => (
            <CouncillorCard
              key={councillor.id}
              councillor={councillor}
              response={council.councillorResponses[councillor.id]}
              onClick={onCardClick}
            />
          ))}
        </div>
      </section>

      {council.chairpersonResponse && (
        <ChairpersonOutput
          response={council.chairpersonResponse}
          replies={council.chairpersonReplies}
          onReply={council.askFollowUp}
          sessionCount={council.sessionLog.length + (council.chairpersonResponse.status !== 'ready' ? 1 : 0)}
        />
      )}
    </div>
  );
}

function NavItem({ icon, label, active, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
        active
          ? 'bg-council-card text-council-text border border-council-border'
          : 'text-council-text-muted hover:text-council-text hover:bg-council-card/50'
      }`}
    >
      <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge != null && (
        <span className="text-xs text-council-text-dim bg-council-border px-1.5 py-0.5 rounded-full">{badge}</span>
      )}
    </button>
  );
}

function groupModels(models) {
  const map = {};
  for (const m of models) {
    const family = m.label.replace(/\s[\d.]+$/, '').trim();
    if (!map[family]) map[family] = { family, description: m.description, models: [] };
    map[family].models.push(m);
  }
  for (const g of Object.values(map)) {
    g.models.sort((a, b) => {
      const va = parseFloat(a.label.match(/[\d.]+$/)?.[0] || '0');
      const vb = parseFloat(b.label.match(/[\d.]+$/)?.[0] || '0');
      return vb - va;
    });
  }
  return Object.values(map).sort((a, b) => a.family.localeCompare(b.family));
}

function ModelPicker({ models, selected, onSelect, disabled }) {
  const [openFamily, setOpenFamily] = useState(null);
  const groups = useMemo(() => groupModels(models), [models]);

  return (
    <div className="flex flex-col gap-0.5">
      {groups.map(({ family, description, models: fModels }) => {
        const activeModel = fModels.find(m => m.id === selected);
        const shown = activeModel || fModels[0];
        const version = shown.label.match(/[\d.]+$/)?.[0];
        const isActive = !!activeModel;
        const isOpen = openFamily === family;
        const hasMultiple = fModels.length > 1;

        return (
          <div key={family}>
            <div className={`flex items-center rounded-lg text-xs transition-colors ${
              isActive
                ? 'bg-council-card border border-council-border-light text-council-text'
                : 'text-council-text-dim hover:text-council-text-muted hover:bg-council-card/50'
            }`}>
              <button
                className="flex-1 flex items-center justify-between px-3 py-1.5 text-left"
                onClick={() => onSelect(shown.id)}
                disabled={disabled}
              >
                <span>{family}</span>
                <span className={isActive ? 'text-council-text-dim' : 'text-council-text-dim/50'}>{description}</span>
              </button>
              {hasMultiple && (
                <button
                  onClick={() => setOpenFamily(isOpen ? null : family)}
                  className={`flex items-center gap-0.5 px-2 py-1.5 border-l border-council-border/40 ${
                    isActive ? 'text-council-text-dim hover:text-council-text' : 'text-council-text-dim/40 hover:text-council-text-dim'
                  }`}
                >
                  <span className="font-mono text-[10px]">{version}</span>
                  <svg className={`w-2.5 h-2.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>
            {isOpen && (
              <div className="ml-2 mt-0.5 pl-2 border-l border-council-border flex flex-col gap-0.5">
                {fModels.map(m => {
                  const v = m.label.match(/[\d.]+$/)?.[0];
                  return (
                    <button
                      key={m.id}
                      onClick={() => { onSelect(m.id); setOpenFamily(null); }}
                      className={`text-left px-2 py-1 rounded text-xs transition-colors ${
                        m.id === selected ? 'text-council-accent' : 'text-council-text-dim hover:text-council-text'
                      }`}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ChamberIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>;
}
function LogIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>;
}
function PersonasIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;
}
function SunIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>;
}
function MoonIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>;
}
