# Admin audit — 2026-09-28

Live API: `http://54.90.250.224`.

- `GET /languages` returned `[]`, while `GET /languages/1` returned English with `is_active: false`. There is no documented include-inactive parameter or admin language collection. Admin now resolves language IDs referenced by courses and IDs previously observed or saved in this browser. It fetches current records from the server, not cached copies. A complete cross-device list of inactive, unreferenced languages still needs a backend endpoint.
- Client course and language collections now exclude inactive languages. This is presentation filtering, not server-side authorization for direct URLs.
- User deactivation previously issued unsupported `DELETE /users/{id}`. It now uses documented `PATCH /users/{id}/active` with `is_active: false`.
- Content create/update/delete methods and fields were checked against live OpenAPI for languages, courses, lessons, exercises, achievements, challenges, level tests and test questions. Mutation requests are covered by mocked API tests, not destructive production smoke tests.
- Browser list checks passed for all eight top-level resources. English remains inactive and editable in admin.
- CORS preflights for DELETE on course, lesson and exercise #1 returned 200 and allowed DELETE and authorization from localhost.
- Production deletion of #1 was not repeated. Its failure is unresolved until the actual response is captured; foreign-key constraints are only a possible explanation, not a confirmed diagnosis. Dialogs now distinguish HTTP status, show resource/ID and do not expose raw SQL traces.
- Backend follow-up: supply the failed DELETE status and server logs; define transactional deletion behavior for child records, progress and attempts. Do not implement automatic client-side cascade deletion as a workaround.
