import { useState, useEffect } from 'react';

const SESSION_KEY = 'council_auth';

function isAuthenticated() {
  try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch { return false; }
}

export default function PasswordGate({ children }) {
  const [authed, setAuthed] = useState(isAuthenticated);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  // Apply dark theme to lockscreen regardless of saved preference
  useEffect(() => {
    if (!authed) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, [authed]);

  if (authed) return children;

  function attempt() {
    if (input === import.meta.env.VITE_PASSWORD) {
      try { sessionStorage.setItem(SESSION_KEY, '1'); } catch {}
      setAuthed(true);
    } else {
      setError(true);
      setShake(true);
      setInput('');
      setTimeout(() => setShake(false), 500);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter') attempt();
    if (error) setError(false);
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-council-bg">
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(201,168,76,0.06) 0%, transparent 70%)' }}
      />

      <div className="relative flex flex-col items-center gap-10 w-full max-w-sm px-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <img src="/favicon.svg" alt="The Council" className="w-16 h-16" />
          <div className="text-center">
            <div className="text-council-accent font-semibold tracking-[0.2em] text-sm uppercase">The Council</div>
            <div className="text-council-text-dim text-xs tracking-widest mt-1 uppercase">Restricted Access</div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full flex items-center gap-3">
          <div className="flex-1 h-px bg-council-border" />
          <span className="text-council-text-dim text-xs">⚖</span>
          <div className="flex-1 h-px bg-council-border" />
        </div>

        {/* Input */}
        <div className={`w-full space-y-3 ${shake ? 'animate-shake' : ''}`}>
          <input
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false); }}
            onKeyDown={handleKey}
            placeholder="Enter passphrase"
            autoFocus
            className={`w-full bg-council-surface border rounded-lg px-4 py-3 text-sm text-council-text placeholder:text-council-text-dim focus:outline-none transition-colors text-center tracking-widest ${
              error
                ? 'border-council-red/60 focus:border-council-red'
                : 'border-council-border focus:border-council-border-light'
            }`}
          />
          {error && (
            <p className="text-council-red text-xs text-center">Incorrect passphrase</p>
          )}
          <button
            onClick={attempt}
            className="w-full py-3 bg-council-accent text-council-bg text-sm font-semibold rounded-lg hover:bg-council-accent-light transition-colors tracking-wide"
          >
            Enter the Chamber
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-5px); }
          80%       { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.45s ease; }
      `}</style>
    </div>
  );
}
