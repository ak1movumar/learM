# Backend follow-up — 2026-09-28

## Language creation

The browser reproduced failure on `POST http://54.90.250.224/languages`
with code `ru`, name `Русский`. User's console reports `net::ERR_FAILED 500 (Internal Server Error)`.
The client receives no readable HTTP response (`AxiosError.response` absent).
This is not proof of a connectivity failure. Inspect the server exception and ensure
CORS headers are also applied to error responses. An OPTIONS preflight for POST
with authorization/content-type from localhost returned 200 and allowed POST.
Do not retry blindly: the write may have committed before response serialization failed.
The subsequent public language collection contained only English, but this collection
excludes inactive records and cannot prove absence of a duplicate.

Client language inputs now trim names/codes, lowercase codes and reject blank fields.
Examples: `ru` / `Русский`, `ky` / `Кыргызча`. These do not resolve a server 500.

## Account deletion

- Self-service request is `DELETE /users/me`, matching the current OpenAPI.
- Its preflight permits DELETE. The failed deletion response still needs to be captured;
  no real account was deleted during verification.
- Admin user removal is not defined: `/users/{user_id}` exposes GET only.
  Existing admin action is explicitly **Deactivate**, using PATCH `/users/{user_id}/active`.
- Backend must define deletion/retention behavior for messages, progress, attempts,
  friendships and refresh sessions, with an atomic transaction and authorization.
  Do not turn a failed DELETE into a simulated successful logout.

## Chat

No WebSocket URL/authentication/event contract was supplied. OpenAPI absence alone
does not establish that WebSocket support is absent from the server.
Frontend uses REST polling: 2 seconds for an open conversation, 5 seconds for previews
and chat discovery, paused in background. Refetch immediately on mount, focus and reconnect,
overriding the global 60-second stale time. WebSocket needs the actual route, authentication,
event types, reconnect and replay semantics before integration.

Validation uses mocked API tests and production build; no messages were sent to other users.
