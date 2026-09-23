# Feedants Full Stack Development Technical Assignment

A functional React Native competition details screen backed by Node.js, Express, and MongoDB. The implementation keeps competition content in MongoDB and derives lifecycle, participation, remaining spots, countdowns, and submission state from server data.

## Project structure

- `mobile/` React Native app built with Expo
- `backend/` Express API, Mongoose models, registration and submission logic
- `docker-compose.yml` local MongoDB replica set for transaction support

## Requirements

- Node.js 20.19+
- npm 10+
- Docker Desktop for the provided MongoDB setup, or a MongoDB instance configured for transactions

## Run locally

1. Start MongoDB:

```bash
docker compose up -d
```

2. Install dependencies:

```bash
npm install
```

3. Seed the competition:

```bash
npm run seed
```

To switch immediately into the submission window for testing the upload flow:

```bash
DEMO_PHASE=submission npm run seed
```

4. Start the API:

```bash
npm run dev:backend
```

The API is available at `http://localhost:4000`.

5. Start the React Native app:

```bash
npm run start:mobile
```

Expo will provide the development server. For a physical device, create `mobile/.env` with the computer's LAN IP:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:4000/api
EXPO_PUBLIC_USER_ID=demo-user-001
```

For the Android emulator, `http://10.0.2.2:4000/api` is normally the correct base URL.

The seeded demo user is already registered so the initial screen matches the supplied reference. Set `EXPO_PUBLIC_USER_ID=demo-user-002` to exercise the registration flow from an unregistered user.

## Web smoke build

```bash
npm run build:mobile
```

This exports the Expo app for the web platform and catches frontend module and bundling errors without requiring a simulator.

## API

`GET /health`

`GET /api/competitions/:slug?userId=demo-user-001`

`POST /api/competitions/:slug/register`

Body:

```json
{
  "userId": "demo-user-001"
}
```

`POST /api/competitions/:slug/submission`

Multipart fields:

- `userId`
- `file`

## Assumptions

Authentication is represented by a demo user ID because the assignment does not provide an auth service. The app sends that ID with every request so the registration state is user-specific.

The seed script creates relative dates so the registration window is open when the project is first seeded. This keeps the demo usable without editing stale dates.

Payment and referral flows are represented as UI and data fields rather than integrated with live third-party services because no credentials or payment flow were supplied.

## Important technical decisions

Registration is protected by a MongoDB transaction and a unique `(competitionId, userId)` index. The competition capacity update is conditional on the current count being below the maximum, preventing two successful registrations from consuming the same final spot.

The frontend does not hardcode competition values. The screen is driven by the API response and recalculates the countdown locally from server-provided timestamps.

Submission files are accepted through Multer and stored under `backend/uploads/` for this assignment. A production deployment would move these files to object storage and store only durable metadata in MongoDB.

## Trade-offs

A full authentication system, payment integration, object storage, CDN, background jobs, analytics, and moderation workflow are intentionally outside the supplied scope. The API and data model leave clear boundaries for adding them later.

## Production improvements

I would add authenticated sessions and authorization, signed object-storage uploads, rate limiting, request validation with a schema library, structured logging, metrics and tracing, idempotency keys for money-related operations, automated database backups, CI/CD, malware scanning for uploads, and a real media-processing pipeline.
