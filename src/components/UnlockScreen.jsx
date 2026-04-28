import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

export default function UnlockScreen() {
  const { profile, unlockKey, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleUnlock(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await unlockKey(password);
    } catch (err) {
      setError(err.message.includes('No API key') ? err.message : 'Incorrect password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-council-bg">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(201,168,76,0.06) 0%, transparent 70%)' }}
      />
      <div className="relative w-full max-w-sm px-6 flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <img src="/favicon.svg" alt="" className="w-14 h-14" />
          <div className="text-center">
            <div className="text-council-text font-semibold">
              Welcome back{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}
            </div>
            <div className="text-council-text-dim text-xs mt-1">
              Enter your password to unlock your API key
            </div>
          </div>
        </div>

        <form onSubmit={handleUnlock} className="w-full space-y-3">
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            placeholder="••••••••"
            autoFocus
            required
            className="w-full bg-council-surface border border-council-border rounded-lg px-3 py-2.5 text-sm text-council-text placeholder:text-council-text-dim focus:outline-none focus:border-council-border-light transition-colors text-center tracking-widest"
          />
          {error && <p className="text-council-red text-xs text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-council-accent text-council-bg text-sm font-semibold rounded-lg hover:bg-council-accent-light transition-colors disabled:opacity-50"
          >
            {loading ? 'Unlocking…' : 'Unlock'}
          </button>
        </form>

        <button
          onClick={signOut}
          className="text-xs text-council-text-dim hover:text-council-text-muted transition-colors"
        >
          Sign out and use a different account
        </button>
      </div>
    </div>
  );
}
