# Workshop backend

A Cloudflare Worker + D1 implementation for the repository's native attendee form, shared notes and moderated Q&A. No Google dependency. No browser-local fake submissions.

## Current status

Implemented and tested locally. **Not deployed.** The configured Sites environment lacks its required packaging helper. A private hosting project has been registered separately, but source in this public repository intentionally includes no hosting identity or credentials. The organizer identity allowlist is empty, so admin operations fail closed.

- `GET /api/content`: shared notes, published/answered questions, parking lot and next steps.
- `POST /api/questions`: saves to D1 and only then confirms a pending receipt. Rate-limited and honeypot checked.
- `GET /api/admin`: organizer queue.
- `POST /api/admin/entries`: post a note, parking-lot item or next step.
- `PATCH /api/admin/questions/:id`: publish, answer or hide a question.
- `/admin`: facilitator UI.
- `GET /api/whoami`: current visitor's platform-provided Site-scoped user ID; no email returned.

Pending questions are not public. No student-identifying information should be entered. Form submissions and moderator actions must be same-origin. The app relies on the Sites platform supplying trusted authenticated identity headers; do not deploy publicly on a generic Worker endpoint without replacing that identity trust boundary.

## Setup

1. Use the supported Sites Worker workflow. Declare D1 binding `DB`; use the schema in `migrations/0001_workshop.sql` as a schema-only deployment migration. Never run table creation in requests.
2. From this server directory, run `npm install`, `npm test`, then `npm run bundle` to embed the root HTML/CSS/JS and same-origin API config into `worker/index.js`.
3. Package and deploy privately with the supported Sites source helper. Do not expose credentials in source or client code.
4. While signed in as the verified Site owner, load `/api/whoami`. Pin that exact Site-scoped `user_id` in `ADMIN_USER_IDS` in `worker/api.js`, rebuild, and redeploy. **Do not substitute the owner's account ID.** Never add an automatic first-visitor-is-admin rule.
5. Test saving a question, durable DB receipt, organizer publication, and updates in a separate browser. Obtain/verify intended attendee access before changing the private audience.
6. GitHub Pages by itself does not execute this backend. Do not enable the submission button on a static copy unless its working backend is actually configured.

## Tests

`npm test` checks basic access boundaries and API routing. `npm run test:integration` uses local Miniflare/D1 to verify a durable question record, pending moderation, published answer feed, admin denial and frontend serving. Run `npm run bundle` first. This does not prove hosted delivery, cross-device access, browser layout or attendee access.
