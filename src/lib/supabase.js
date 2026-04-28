import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  document.body.innerHTML = `
    <div style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#080808;color:#c9a84c;flex-direction:column;gap:16px;text-align:center;padding:24px">
      <div style="font-size:32px">⚖️</div>
      <div style="font-size:18px;font-weight:600">Configuration missing</div>
      <div style="font-size:13px;color:#888;max-width:400px">
        VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set as environment variables.<br><br>
        In Vercel: Settings → Environment Variables → add both keys, then redeploy.
      </div>
    </div>`;
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(url, key);
