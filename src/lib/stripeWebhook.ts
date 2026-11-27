import { applyWebhook, type StripeEvent, type WebhookEffect } from './stripeConnect';

const MAX_AGE_SECONDS = 300;

function hexFromBuffer(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Vérifie l’en-tête Stripe-Signature. Refuse un secret vide ou YOUR_*. */
export async function verifyStripeSignature(payload: string, header: string, secret: string, nowSeconds: number): Promise<{ ok: true } | { ok: false; reason: 'missing_secret' | 'malformed' | 'stale' | 'bad_signature' }> {
  if (!secret.trim() || secret.startsWith('YOUR_')) return { ok: false, reason: 'missing_secret' };
  const parts = Object.fromEntries(header.split(',').map((part) => {
    const i = part.indexOf('=');
    return [part.slice(0, i), part.slice(i + 1)];
  }));
  const timestamp = Number(parts.t);
  const v1 = parts.v1;
  if (!timestamp || !v1) return { ok: false, reason: 'malformed' };
  if (Math.abs(nowSeconds - timestamp) > MAX_AGE_SECONDS) return { ok: false, reason: 'stale' };
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${payload}`));
  if (hexFromBuffer(mac) !== v1) return { ok: false, reason: 'bad_signature' };
  return { ok: true };
}

export async function handleStripeWebhook(rawBody: string, header: string, secret: string, seen: Set<string>, nowSeconds: number): Promise<{ status: number; effect?: WebhookEffect; reason?: string }> {
  const verified = await verifyStripeSignature(rawBody, header, secret, nowSeconds);
  if (!verified.ok) return { status: 400, reason: verified.reason };
  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return { status: 400, reason: 'malformed' };
  }
  return { status: 200, effect: applyWebhook(event, seen) };
}
