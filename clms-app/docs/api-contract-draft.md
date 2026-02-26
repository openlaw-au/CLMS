# CLMS API Contract Draft (for backend wiring)

## Auth / User
- `POST /signup`
  - request: `{ name, email, password, role }`
  - response: `{ userId, role, token }`

## Chambers
- `GET /chambers/search?q=`
  - response: `[{ id, name, members, locations }]`

- `POST /chambers/join`
  - request: `{ chamberId }`
  - response: `{ chamberId, status: "joined" }`

## Invites
- `POST /invites/clerk`
  - request: `{ email }`
  - response: `{ status: "sent" }`

- `POST /invites/members`
  - request: `{ invites: [{ email, role }] }`
  - response: `{ sentCount }`

## Onboarding
- `POST /onboarding/complete`
  - request: `{ role, mode, setup: {...} }`
  - response: `{ completed: true }`
