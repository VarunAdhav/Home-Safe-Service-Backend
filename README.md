# Safe Home Services — Backend (Node/Express/Mongo Atlas)

## Setup
1. Copy `.env.example` to `.env` and fill `MONGO_URI` with your MongoDB Atlas connection string.
2. `npm install`
3. `npm run dev`

## Endpoints
- `POST /api/auth/register` — { name, email, password, role }
- `POST /api/auth/login` — { email, password }
- `POST /api/auth/consent` — { userId, consent }

- `GET /api/services` — list available
- `POST /api/services/add` — provider only
- `POST /api/services/:id/book` — customer only
- `POST /api/services/:id/cancel` — customer only (who booked)

- `POST /api/tracing/report-positive` — auth required, body { beaconIds[], retentionDays }
- `GET  /api/tracing/positives` — returns list of positive beacon ids

## Notes on Privacy-by-Design Tracing
- Users generate **local rotating beacon IDs** (no PII).
- Upon positive test, user uploads only their recent beacon IDs.
- Everyone periodically downloads `positives` and locally compares to their encounter log.
- Server never stores identity->contact mappings.
