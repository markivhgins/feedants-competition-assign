# Feedants Competition Details

A full-stack implementation of the Feedants competition details experience built with React Native, Expo, Node.js, Express, and MongoDB.

The application is driven by server-side competition data and supports registration, competition lifecycle states, participant counts, countdowns, and submission handling.

## Tech Stack

- React Native + Expo
- Node.js
- Express
- MongoDB
- Mongoose
- Multer
- Docker (optional local MongoDB setup)

## Project Structure

.
├── backend/
│   ├── src/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── seed.js
│   └── .env.example
│
├── mobile/
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   └── services/
│   └── .env.example
│
├── reference/
├── docker-compose.yml
└── package.json

## Requirements

- Node.js 20+
- npm 10+
- MongoDB database
- Expo-compatible environment for running the mobile application

MongoDB Atlas can be used directly. A local MongoDB replica-set configuration is also provided through Docker.

## Setup

### 1. Install dependencies

From the project root:

npm install

### 2. Configure the backend

Create:

backend/.env

from the provided example:

cp backend/.env.example backend/.env

Configure the MongoDB connection:

MONGODB_URI=your_mongodb_connection_string
PORT=4000
CORS_ORIGIN=*
DEMO_USER_ID=demo-user-001

Do not commit backend/.env.

### 3. Seed the database

npm run seed

The seed script creates the competition data and a registered demo user.

The seed data uses relative dates so that the competition can be tested without manually updating expired timestamps.

To seed directly into the submission phase:

DEMO_PHASE=submission npm run seed

## Running the Backend

npm run dev:backend

The API runs on:

http://localhost:4000

Health check:

GET /health

## Running the Mobile App

Create:

mobile/.env

using:

EXPO_PUBLIC_API_BASE_URL=http://localhost:4000/api
EXPO_PUBLIC_USER_ID=demo-user-001

Then start Expo:

npm run start:mobile

### Physical Android Device

Replace localhost with the LAN IP address of the machine running the backend:

EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:4000/api

The phone and computer must be connected to the same network.

### Android Emulator

Use:

EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:4000/api

## Testing the Registration Flow

The default seeded user is:

demo-user-001

and is registered by default.

To test registration from an unregistered user, use:

EXPO_PUBLIC_USER_ID=demo-user-002

The registration flow is backed by the API and updates the competition participant count.

## Submission Flow

The submission flow can be tested by seeding the competition into the submission phase:

DEMO_PHASE=submission npm run seed

The registered demo user can then upload an image or video submission through the application.

Uploaded files are stored locally under:

backend/uploads/

For a production deployment, these files would be stored in object storage rather than the application filesystem.

## Web Smoke Build

The Expo application can also be exported for web:

npm run build:mobile

This provides a quick way to verify frontend bundling and module compatibility.

## API

### Get Competition

GET /api/competitions/:slug?userId=demo-user-001

Returns competition details including:

- Competition lifecycle
- Participant count
- Remaining spots
- Registration status
- Submission status
- Competition dates
- Judge information
- Rewards
- Winners
- Referral information

### Register

POST /api/competitions/:slug/register

Request body:

{
  "userId": "demo-user-001"
}

### Submit

POST /api/competitions/:slug/submission

Multipart form fields:

userId
file

Only image and video submissions are accepted, with a maximum file size of 100 MB.

## Implementation Details

### Competition Lifecycle

The competition lifecycle is derived from server-side timestamps rather than being hardcoded in the frontend.

The application handles states including:

- Registration open
- Submission open
- Registration/submission closed

The frontend calculates countdowns from the timestamps returned by the API.

### Registration Concurrency

Registration is handled inside a MongoDB transaction.

A unique index on:

competitionId + userId

prevents duplicate registrations.

The participant count is incremented conditionally only while capacity remains, preventing registrations from exceeding the configured participant limit.

### User State

Authentication was outside the scope of the assignment, so a demo user ID is used to represent the current user.

The API uses this ID to determine whether the user has registered and whether they can submit.

## Assumptions and Scope

The assignment did not provide an authentication service, payment credentials, or third-party storage configuration.

Therefore:

- Authentication is represented by a demo user ID.
- Payment information is represented as competition data/UI.
- Referral information is represented as competition data/UI.
- Submission files are stored locally for the assignment.

These boundaries can be replaced with production services without changing the core competition lifecycle and registration flow.

## Tests

Backend tests can be run with:

npm test

The test suite covers core lifecycle logic and API health behaviour.

## Production Considerations

For production, I would add:

- Authenticated sessions and authorization
- Schema-based request validation
- Rate limiting
- Object storage for submissions
- Malware scanning for uploaded files
- Structured logging and monitoring
- Automated database backups
- CI/CD
- Media processing
- Idempotency for payment-related operations
