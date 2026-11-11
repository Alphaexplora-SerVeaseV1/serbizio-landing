// Sends coming-soon sign-ups to the Serbizio backend. On Vercel, vercel.json
// forwards /api/v1/launch-waitlist to the backend on Render, so the browser
// makes a same-origin request and never holds a database key.

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '') || '/api';
const TIMEOUT_MS = 15_000;
const FALLBACK_MESSAGE = "We couldn't save your email right now. Please try again in a moment.";

export const PRIVACY_URL = import.meta.env.VITE_PRIVACY_URL || 'https://serbizio-website.vercel.app/privacy';

export type JoinWaitlistResult = { ok: true } | { ok: false; message: string };

export async function joinWaitlist(email: string, honeypot: string): Promise<JoinWaitlistResult> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE}/v1/launch-waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, consent: true, website: honeypot }),
      signal: controller.signal,
    });
    if (response.ok) return { ok: true };
    if (response.status === 400) return { ok: false, message: 'Please enter a valid email address.' };
    if (response.status === 429) {
      return { ok: false, message: 'Too many tries from this network. Please wait a minute and try again.' };
    }
    return { ok: false, message: FALLBACK_MESSAGE };
  } catch {
    return { ok: false, message: FALLBACK_MESSAGE };
  } finally {
    window.clearTimeout(timer);
  }
}
