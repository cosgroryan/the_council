import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

export default function AuthScreen() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-council-bg">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(201,168,76,0.06) 0%, transparent 70%)' }}
      />
      <div className="relative w-full max-w-md px-6 flex flex-col items-center gap-8">
        {/* Wordmark */}
        <div className="flex flex-col items-center gap-3">
          <img src="/favicon.svg" alt="" className="w-14 h-14" />
          <div className="text-center">
            <div className="text-council-accent font-semibold tracking-[0.2em] text-sm uppercase">The Council</div>
            <div className="text-council-text-dim text-xs tracking-widest mt-0.5 uppercase">
              {mode === 'login' ? 'Sign in to your chamber' : 'Create your account'}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full flex items-center gap-3">
          <div className="flex-1 h-px bg-council-border" />
          <span className="text-council-text-dim text-xs">⚖</span>
          <div className="flex-1 h-px bg-council-border" />
        </div>

        {/* Form */}
        <div className="w-full">
          {mode === 'login'
            ? <LoginForm onSwitch={() => setMode('signup')} />
            : <SignupForm onSwitch={() => setMode('login')} />
          }
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onSwitch }) {
  const { signIn } = useAuth();
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
      <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
      {error && <p className="text-council-red text-xs">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-council-accent text-council-bg text-sm font-semibold rounded-lg hover:bg-council-accent-light transition-colors disabled:opacity-50 mt-1"
      >
        {loading ? 'Signing in…' : 'Enter the Chamber'}
      </button>
      <p className="text-center text-xs text-council-text-dim pt-1">
        No account?{' '}
        <button type="button" onClick={onSwitch} className="text-council-accent hover:underline">
          Sign up
        </button>
      </p>
    </form>
  );
}

function SignupForm({ onSwitch }) {
  const { signUp } = useAuth();
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [apiKey, setApiKey]         = useState('');
  const [showKeyHelp, setShowKeyHelp] = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Name is required.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (!apiKey.trim().startsWith('sk-ant-')) return setError('Please enter a valid Anthropic API key (starts with sk-ant-).');
    setLoading(true);
    try {
      await signUp(name.trim(), email, password, apiKey.trim());
    } catch (err) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field label="Your name" type="text" value={name} onChange={setName} placeholder="Ada Lovelace" />
      <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
      <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Min. 8 characters" />

      {/* API Key field */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-council-text-dim uppercase tracking-widest">Anthropic API Key</label>
          <button
            type="button"
            onClick={() => setShowKeyHelp(h => !h)}
            className="text-xs text-council-accent hover:underline"
          >
            {showKeyHelp ? 'Hide' : 'How to get one'}
          </button>
        </div>
        {showKeyHelp && (
          <div className="mb-2 p-3 bg-council-surface border border-council-border rounded-lg text-xs text-council-text-muted space-y-1.5 leading-relaxed">
            <p className="font-medium text-council-text">Get your free API key from Anthropic:</p>
            <ol className="space-y-1 list-decimal list-inside">
              <li>Go to <span className="text-council-accent">console.anthropic.com</span></li>
              <li>Create an account or sign in</li>
              <li>Navigate to <span className="font-medium">API Keys</span></li>
              <li>Click <span className="font-medium">Create Key</span> and copy it</li>
            </ol>
            <p className="text-council-text-dim">New accounts include free credits. Usage charges apply after.</p>
          </div>
        )}
        <input
          type="password"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder="sk-ant-api03-…"
          required
          className="w-full bg-council-surface border border-council-border rounded-lg px-3 py-2 text-sm text-council-text placeholder:text-council-text-dim focus:outline-none focus:border-council-border-light transition-colors"
        />
        <p className="text-xs text-council-text-dim mt-1">
          Encrypted with your password before leaving your browser — we never see it in plaintext.
        </p>
      </div>

      {error && <p className="text-council-red text-xs">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-council-accent text-council-bg text-sm font-semibold rounded-lg hover:bg-council-accent-light transition-colors disabled:opacity-50 mt-1"
      >
        {loading ? 'Creating account…' : 'Convene the Council'}
      </button>
      <p className="text-center text-xs text-council-text-dim pt-1">
        Already have an account?{' '}
        <button type="button" onClick={onSwitch} className="text-council-accent hover:underline">
          Sign in
        </button>
      </p>
    </form>
  );
}

function Field({ label, type, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs text-council-text-dim uppercase tracking-widest mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full bg-council-surface border border-council-border rounded-lg px-3 py-2 text-sm text-council-text placeholder:text-council-text-dim focus:outline-none focus:border-council-border-light transition-colors"
      />
    </div>
  );
}
