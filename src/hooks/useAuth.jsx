import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { encryptApiKey, decryptApiKey } from '../lib/crypto';

const KEY_STORE = 'council_apikey'; // sessionStorage — cleared on tab close

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [apiKey, setApiKey]   = useState(() => {
    try { return sessionStorage.getItem(KEY_STORE) ?? null; } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  function cacheKey(key) {
    setApiKey(key);
    try {
      if (key) sessionStorage.setItem(KEY_STORE, key);
      else      sessionStorage.removeItem(KEY_STORE);
    } catch {}
  }

  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select().eq('id', userId).single();
    if (data) setProfile(data);
    return data;
  }

  async function fetchAndDecryptKey(userId, password) {
    const { data } = await supabase.from('api_keys').select().eq('user_id', userId).single();
    if (!data) return null;
    return decryptApiKey(password, data.encrypted_key, data.iv, data.salt);
  }

  // Restore session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
        // apiKey restored from sessionStorage in useState initialiser above
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null); setProfile(null); cacheKey(null);
      } else if (session?.user) {
        setUser(session.user);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Sign up ──────────────────────────────────────────────────
  const signUp = useCallback(async (name, email, password, anthropicKey) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    const uid = data.user.id;
    await supabase.from('profiles').insert({ id: uid, name });

    const encrypted = await encryptApiKey(password, anthropicKey);
    await supabase.from('api_keys').insert({ user_id: uid, ...encrypted });

    setUser(data.user);
    setProfile({ id: uid, name });
    cacheKey(anthropicKey);
    return data;
  }, []);

  // ── Sign in ──────────────────────────────────────────────────
  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    setUser(data.user);
    await fetchProfile(data.user.id);

    const key = await fetchAndDecryptKey(data.user.id, password).catch(() => null);
    if (key) cacheKey(key);
    return data;
  }, []);

  // ── Unlock key when session is active but sessionStorage was cleared ─
  const unlockKey = useCallback(async (password) => {
    if (!user) throw new Error('Not authenticated');
    const key = await fetchAndDecryptKey(user.id, password);
    if (!key) throw new Error('No API key found — add one in Account settings.');
    cacheKey(key);
    return key;
  }, [user]);

  // ── Sign out ─────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null); cacheKey(null);
  }, []);

  // ── Update profile ───────────────────────────────────────────
  const updateProfile = useCallback(async (updates) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles').update(updates).eq('id', user.id).select().single();
    if (error) throw error;
    setProfile(data);
    return data;
  }, [user]);

  // ── Update Anthropic API key ──────────────────────────────────
  const updateApiKey = useCallback(async (password, newAnthropicKey) => {
    if (!user) throw new Error('Not authenticated');
    // Verify password by decrypting existing key first (throws if wrong)
    await fetchAndDecryptKey(user.id, password);
    const encrypted = await encryptApiKey(password, newAnthropicKey);
    const { error } = await supabase
      .from('api_keys').upsert({ user_id: user.id, ...encrypted });
    if (error) throw error;
    cacheKey(newAnthropicKey);
  }, [user]);

  // ── Change password (re-encrypts API key with new password) ──
  const updatePassword = useCallback(async (currentPassword, newPassword) => {
    if (!user) throw new Error('Not authenticated');
    const existingKey = await fetchAndDecryptKey(user.id, currentPassword); // throws if wrong
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    if (existingKey) {
      const encrypted = await encryptApiKey(newPassword, existingKey);
      await supabase.from('api_keys').upsert({ user_id: user.id, ...encrypted });
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, profile, apiKey, loading,
      signUp, signIn, signOut, unlockKey,
      updateProfile, updateApiKey, updatePassword,
      hasApiKey: !!apiKey,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
