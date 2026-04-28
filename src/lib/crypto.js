// Client-side AES-256-GCM encryption for Anthropic API keys.
// Key derivation: PBKDF2(password, random_salt, 120 000 iterations, SHA-256).
// The server stores only ciphertext + nonce + salt — never the plaintext key.

function b64enc(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function b64dec(str) {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

async function deriveKey(password, salt) {
  const raw = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password),
    'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 120_000, hash: 'SHA-256' },
    raw,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptApiKey(password, plaintext) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(password, salt);
  const ct   = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  return { encrypted_key: b64enc(ct), iv: b64enc(iv), salt: b64enc(salt) };
}

export async function decryptApiKey(password, encryptedKey, iv, salt) {
  const key = await deriveKey(password, b64dec(salt));
  const pt  = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64dec(iv) },
    key,
    b64dec(encryptedKey)
  );
  return new TextDecoder().decode(pt);
}
