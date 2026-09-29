# Registration onboarding

Implemented frontend flow: registration → automatic sign-in → `/onboarding` → language → experience → purpose and daily minutes → basics or placement test. Failed automatic sign-in returns to login with the onboarding destination, without repeating registration. Only active languages with existing courses are offered. Drafts are validated, account/API-scoped and stored locally; unfinished setup resumes on this browser. Existing users are not forced through the wizard.

## Required backend integration

The live OpenAPI retrieved on 2026-09-27 has no beginner enrollment or onboarding preferences endpoint. The UI does not invent results, submit empty placement attempts or bypass learning-path locks. Starting basics currently succeeds only if the server already exposes an unlocked A1 lesson; otherwise a message explains availability and offers placement.

Proposed contract for backend implementation (not a live endpoint):

`PUT /users/me/learning-preferences`

Request fields: `language_id` (active language with courses), `experience` (`new`, `some`, `conversation`, `unsure`), `purpose` (`travel`, `work`, `study`, `personal`), `daily_minutes` (5, 10, 15), `start_mode` (`beginner`, `placement`).

- Authenticate the current user; never accept a user id from the request.
- Make repeat submissions idempotent per user and language.
- For `beginner`, open A1 with no fabricated test attempt or score. Do not reset an existing higher level or erase progress.
- For `placement`, save preferences and keep existing level-test logic.
- Return the saved preferences and current course access. Provide a read endpoint so setup can resume across devices.
- Learning-path responses should distinguish beginner enrollment from completed placement; optional later placement must remain available.

Once the backend contract is supplied, call it from the wizard before fetching the learning path and replace local-only completion tracking with server state.
