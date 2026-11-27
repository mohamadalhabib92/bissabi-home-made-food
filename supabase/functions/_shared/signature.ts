const MAX_AGE_SECONDS = 300;

const CONNECT_EVENTS = new Set(['account.updated', 'payout.paid', 'payout.failed']);

export function isConnectEvent(type: string): boolean {
  return CONNECT_EVENTS.has(type);
}

function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function safeHexEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Vérifie `Stripe-Signature`. Un secret vide ou `YOUR_*` ne passe pas. */
export async function signatureMatches(payload: string, header: string, secret: string | undefined, nowSeconds: number): Promise<boolean> {
  if (!secret || secret.startsWith('YOUR_')) return false;
  const parts = Object.fromEntries(header.split(',').map((part) => {
    const i = part.indexOf('=');
    return [part.slice(0, i).trim(), part.slice(i + 1).trim()];
  }));
  const timestamp = Number(parts.t);
  const v1 = parts.v1;
  if (!timestamp || !v1) return false;
  if (Math.abs(nowSeconds - timestamp) > MAX_AGE_SECONDS) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${payload}`));
  return safeHexEqual(hex(mac), v1);
}
