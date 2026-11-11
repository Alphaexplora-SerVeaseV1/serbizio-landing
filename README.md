# Serbizio Landing

A coming-soon page with an interactive 3D neighborhood and a walk through the front door. Built with React, TypeScript, Vite, React Three Fiber, Drei, and GSAP.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Run `npm run build` to type-check the project and build the site into `dist/`.

## Launch sign-ups

The email form saves sign-ups through the Serbizio backend (`POST /v1/launch-waitlist`), which stores them in the private `launch_waitlist.signups` table in Supabase. The page never talks to Supabase directly and holds no database keys. The welcome animation plays only after the email is saved; if the backend is unreachable, the visitor sees a retry message and keeps what they typed.

- **Production:** `vercel.json` forwards `/api/v1/launch-waitlist` to the backend on Render, so no environment variables or CORS changes are needed.
- **Local:** copy `.env.example` to `.env.local` and point `VITE_API_PROXY_TARGET` at a running gateway (`npm run dev:gateway` in Serbizio-backend). Without it, sign-ups show the retry message.

The note under the form ("One email on launch day. Nothing else.") is the consent the backend records as `launch-day-email-v1`. If you change that wording, bump `LAUNCH_WAITLIST_CONSENT_VERSION` in the backend at the same time.
