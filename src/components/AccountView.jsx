import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

export default function AccountView({ sessionLog = [] }) {
  const { user, profile, signOut } = useAuth();

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-council-text">Account</h2>
        <p className="text-sm text-council-text-muted mt-1">{user?.email}</p>
      </div>

      <ProfileSection />
      <UsageSection sessionLog={sessionLog} />
      <ApiKeySection />
      <SecuritySection />
      <DangerZone onSignOut={signOut} />
    </div>
  );
}

/* ── Usage ───────────────────────────────────────────────────── */
function fmtNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return n.toLocaleString();
}

function UsageSection({ sessionLog }) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let totalIn = 0, totalOut = 0, monthIn = 0, monthOut = 0;
  for (const s of sessionLog) {
    totalIn  += s.inputTokens  ?? 0;
    totalOut += s.outputTokens ?? 0;
    if (new Date(s.timestamp) >= startOfMonth) {
      monthIn  += s.inputTokens  ?? 0;
      monthOut += s.outputTokens ?? 0;
    }
  }

  const total      = totalIn + totalOut;
  const monthTotal = monthIn + monthOut;

  // Last 7 days by date
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return { label: d.toLocaleDateString([], { weekday: 'short' }), date: d.toDateString(), tokens: 0 };
  });
  for (const s of sessionLog) {
    const ds = new Date(s.timestamp).toDateString();
    const day = days.find(d => d.date === ds);
    if (day) day.tokens += (s.inputTokens ?? 0) + (s.outputTokens ?? 0);
  }
  const maxDayTokens = Math.max(...days.map(d => d.tokens), 1);

  const monthName = now.toLocaleDateString([], { month: 'long', year: 'numeric' });

  return (
    <Card title="Usage">
      <div className="space-y-5">
        {/* All-time stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'All-time tokens', value: fmtNum(total) },
            { label: 'Input tokens',    value: fmtNum(totalIn) },
            { label: 'Output tokens',   value: fmtNum(totalOut) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-council-surface border border-council-border rounded-lg px-3 py-3 text-center">
              <div className="text-base font-semibold text-council-text tabular-nums">{value}</div>
              <div className="text-[10px] text-council-text-dim mt-0.5 uppercase tracking-widest">{label}</div>
            </div>
          ))}
        </div>

        {/* This month */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-council-text-dim uppercase tracking-widest">{monthName}</span>
            <span className="text-xs text-council-text font-medium tabular-nums">{fmtNum(monthTotal)} tokens</span>
          </div>
          <div className="h-1.5 rounded-full bg-council-surface overflow-hidden">
            <div
              className="h-full rounded-full bg-council-accent/60 transition-all"
              style={{ width: total > 0 ? `${Math.min(100, (monthTotal / total) * 100)}%` : '0%' }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-council-text-dim/60 mt-1">
            <span>{fmtNum(monthIn)} in</span>
            <span>{fmtNum(monthOut)} out</span>
          </div>
        </div>

        {/* Last 7 days bar chart */}
        <div>
          <div className="text-xs text-council-text-dim uppercase tracking-widest mb-2">Last 7 days</div>
          <div className="flex items-end gap-1 h-12">
            {days.map(({ label, tokens }) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full relative flex items-end" style={{ height: '36px' }}>
                  <div
                    className="w-full rounded-sm bg-council-accent/50 transition-all"
                    style={{ height: tokens > 0 ? `${Math.max(4, (tokens / maxDayTokens) * 36)}px` : '2px', opacity: tokens > 0 ? 1 : 0.2 }}
                    title={tokens > 0 ? `${tokens.toLocaleString()} tokens` : 'No usage'}
                  />
                </div>
                <span className="text-[9px] text-council-text-dim/60 uppercase">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {total === 0 && (
          <p className="text-xs text-council-text-dim text-center py-2">
            Token usage will appear here after your first session.
          </p>
        )}

        <p className="text-[10px] text-council-text-dim/60 leading-relaxed">
          Usage is computed from sessions stored in The Council. Tokens include synthesizer, councillor, and chairperson calls per session.
        </p>
      </div>
    </Card>
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
