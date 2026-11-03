# AI in practice — workshop notebook

A responsive, buildless HTML workshop hub with running notes, questions and answers, parking lot, next steps, and resources. No Google dependency, trackers, or front-end credentials.

## Run
Serve these files on any static host. Set `apiBase` in `config.js` to the approved backend HTTPS origin, or `.` when API and site share an origin.

Until a backend is configured, the page clearly says preview, disables submission, and never pretends to collect questions. The initial notebook is empty; no workshop discussion is fabricated.

## API contract
- `GET /api/content` → `{notes:[], questions:[], parking:[], next:[], resources:[]}`
- `POST /api/questions` with JSON `{question, topic, website}` → `{ok:true}` only after durable storage. `website` is a honeypot and should remain blank.
- Raw questions are private to the facilitator. Only selected, moderated Q&A should appear in the public content endpoint.

Data rows:
- notes: `{topic,text}`
- questions: `{question,status,answer}`
- parking: `{idea,why,followUp}`
- next: `{experiment,who,nextStep}`
- resources: `{title,description,url}`

The frontend refreshes shared content every 30 seconds while visible. It retains a question on a failed or uncertain send. All content is rendered as text, not HTML; only HTTPS resource links are allowed. Never commit personal/student records, raw responses, or credentials to this public repository.

## Validation
JavaScript syntax and internal HTML anchors checked. Browser/device QA and a real submission must be verified against the deployed backend before calling the site ready.
