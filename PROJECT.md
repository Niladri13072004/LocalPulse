# Project: LocalPulse Feed Filtering and Backend Migration

## Architecture
- React Native Expo frontend running on Web (http://localhost:8085).
- A backend service exposing REST API endpoints:
  - `GET /api/issues`: fetches issues based on status, category, radius, userLocation.
  - `GET /api/events`: fetches community events.
- A database seeded with issues (categories: Pothole, Water logging, Garbage, Electricity, Safety, Others; statuses: Open, In Progress, Resolved) and community events.
- Distance calculation on the backend to filter issues by selected radius.
- Frontend updated to query the backend endpoints.

## Code Layout
- Frontend screens:
  - `app/(citizen)/home.tsx` - home feed and filtering UI.
  - `app/(citizen)/events.tsx` - community events display.
- Store & state management:
  - `store/useIssueStore.ts` - zustand store for issues.
- Backend code:
  - `server/server.js` (or similar) - server entry point.
- Database:
  - `db/schema.sql`, `db/seed.sql`

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Exploration | Explore system environment (PostgreSQL / SQLite support, Node / Python) and determine backend framework. | None | DONE |
| 2 | Backend Setup | Implement server, routing, distance filtering using Haversine formula, database schema, and seed data. | M1 | DONE |
| 3 | Frontend Integration | Update home feed UI filters (Status, Radius) and modify stores to request from the real backend. | M2 | DONE |
| 4 | Verification | Run browser automation script to capture screenshots and generate the verification report. | M3 | DONE |

## Interface Contracts
### Frontend ↔ Backend
- `GET /api/issues`
  - Request Query Parameters:
    - `status`: 'all' | 'open' | 'in_progress' | 'resolved'
    - `category`: string (e.g., 'All', 'Pothole', 'Water logging', etc.)
    - `radius`: number (1, 3, 5, 10)
    - `latitude`: number (optional/user location)
    - `longitude`: number (optional/user location)
  - Response: JSON array of Issue objects.
- `GET /api/events`
  - Response: JSON array of Event objects.
