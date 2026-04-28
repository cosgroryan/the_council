import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

export default function AccountView() {
  const { user, profile, signOut } = useAuth();

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-council-text">Account</h2>
        <p className="text-sm text-council-text-muted mt-1">{user?.email}</p>
      </div>

      <ProfileSection />
      <ApiKeySection />
      <SecuritySection />
      <DangerZone onSignOut={signOut} />
    </div>
  );
}

/* ── Profile ─────────────────────────────────────────────────── */
function ProfileSection() {
  const { profile, updateProfile } = useAuth();
  const [name, setName]     = useState(profile?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState('');

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true); setError(''); setSaved(false);
    try {
      await updateProfile({ name: name.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Profile">
      <div className="space-y-3">
        <FormField label="Name">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className={inputCls}
          />
        </FormField>
        {error && <p className="text-council-red text-xs">{error}</p>}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className={primaryBtn}
          >
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
          </button>
        </div>
      </div>
    </Card>
  );
}

/* ── API Key ─────────────────────────────────────────────────── */
function ApiKeySection() {
  const { apiKey, updateApiKey } = useAuth();
  const [password, setPassword] = useState('');
  const [newKey, setNewKey]     = useState('');
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');
  const [open, setOpen]         = useState(false);

  const maskedKey = apiKey
    ? apiKey.slice(0, 14) + '•'.repeat(16) + apiKey.slice(-4)
    : '—';

  async function handleUpdate() {
    if (!password || !newKey.trim().startsWith('sk-ant-'))
      return setError('Enter your password and a valid Anthropic key (sk-ant-…).');
    setSaving(true); setError('');
    try {
      await updateApiKey(password, newKey.trim());
      setSaved(true); setOpen(false); setPassword(''); setNewKey('');
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Incorrect password or failed to save key.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Anthropic API Key">
      <div className="space-y-4">
        {/* Current key display */}
        <div className="flex items-center gap-3 p-3 bg-council-surface border border-council-border rounded-lg">
          <span className="font-mono text-xs text-council-text-muted flex-1">{maskedKey}</span>
          {saved && <span className="text-xs text-council-green">Updated ✓</span>}
          <button
            onClick={() => setOpen(o => !o)}
            className="text-xs text-council-accent hover:underline flex-shrink-0"
          >
            {open ? 'Cancel' : 'Update key'}
          </button>
        </div>

        {/* Update form */}
        {open && (
          <div className="space-y-3 pt-1">
            <FormField label="Current password (to verify identity)">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} />
            </FormField>
            <FormField label="New Anthropic API key">
              <input type="password" value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="sk-ant-api03-…" className={inputCls} />
            </FormField>
            {error && <p className="text-council-red text-xs">{error}</p>}
            <button onClick={handleUpdate} disabled={saving} className={primaryBtn}>
              {saving ? 'Updating…' : 'Update key'}
            </button>
          </div>
        )}

        {/* Security explanation */}
        <div className="p-3 bg-council-surface border border-council-border rounded-lg space-y-2">
          <div className="text-xs font-medium text-council-text-muted uppercase tracking-widest">How your key is stored</div>
          <ul className="text-xs text-council-text-dim space-y-1.5 leading-relaxed">
            <li>🔐 Encrypted in your browser with AES-256-GCM before being sent to our servers</li>
            <li>🔑 The encryption key is derived from your password using PBKDF2 (120 000 iterations, SHA-256) — we never receive your plaintext key</li>
            <li>🛡 Protected by Row Level Security in Supabase — only your authenticated session can read the encrypted blob</li>
            <li>💾 Temporarily held in your browser's session storage while you're active — cleared when you close the tab</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}

/* ── Security / Password ─────────────────────────────────────── */
function SecuritySection() {
  const { updatePassword } = useAuth();
  const [current, setCurrent]   = useState('');
  const [next, setNext]         = useState('');
  const [confirm, setConfirm]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');

  async function handleChange() {
    setError('');
    if (next.length < 8) return setError('New password must be at least 8 characters.');
    if (next !== confirm) return setError('Passwords do not match.');
    setSaving(true);
    try {
      await updatePassword(current, next);
      setSaved(true); setCurrent(''); setNext(''); setConfirm('');
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message.includes('decrypt') ? 'Current password is incorrect.' : err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Change Password">
      <div className="space-y-3">
        <FormField label="Current password">
          <input type="password" value={current} onChange={e => setCurrent(e.target.value)} className={inputCls} />
        </FormField>
        <FormField label="New password">
          <input type="password" value={next} onChange={e => setNext(e.target.value)} placeholder="Min. 8 characters" className={inputCls} />
        </FormField>
        <FormField label="Confirm new password">
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className={inputCls} />
        </FormField>
        {error && <p className="text-council-red text-xs">{error}</p>}
        <div className="flex items-center gap-3">
          <button onClick={handleChange} disabled={saving} className={primaryBtn}>
            {saving ? 'Changing…' : saved ? 'Password changed ✓' : 'Change password'}
          </button>
        </div>
        <p className="text-xs text-council-text-dim">
          Changing your password automatically re-encrypts your API key with the new one.
        </p>
      </div>
    </Card>
  );
}

/* ── Danger zone ─────────────────────────────────────────────── */
function DangerZone({ onSignOut }) {
  return (
    <Card title="Session">
      <button
        onClick={onSignOut}
        className="text-sm px-4 py-2 border border-council-border text-council-text-muted rounded-lg hover:border-council-red/50 hover:text-council-red transition-colors"
      >
        Sign out
      </button>
    </Card>
  );
}

/* ── Shared primitives ───────────────────────────────────────── */
function Card({ title, children }) {
  return (
    <div className="bg-council-card border border-council-border rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-council-border">
        <h3 className="text-sm font-medium text-council-text">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-council-text-dim uppercase tracking-widest mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full bg-council-surface border border-council-border rounded px-3 py-2 text-sm text-council-text focus:outline-none focus:border-council-border-light transition-colors';
const primaryBtn = 'text-xs px-4 py-2 bg-council-accent text-council-bg font-semibold rounded-lg hover:bg-council-accent-light transition-colors disabled:opacity-50';
