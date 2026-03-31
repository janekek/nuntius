# Project Guidelines

## Code Style
- Prefer TypeScript for both app layers and keep strict typing intact (both frontend and backend tsconfig files use strict mode).
- Follow existing React patterns in src/frontend/src: functional components, hooks, and co-located CSS modules in components/styles.
- Keep API contracts centralized in shared files under src/frontend/src/shared and update frontend and backend usages together.

## Architecture
- Main frontend app: src/frontend (Create React App + React Router + TanStack Query).
- Main Node backend: src/backend (Express + sessions + Socket.IO + SQLite via better-sqlite3).
- API and session expectations are wired through src/frontend/src/utils/apiClient.tsx and src/backend/src/index.ts.
- Legacy/generated directories exist (build, newBackend, static, pyBackend, pyDatabase). Do not treat these as primary sources unless the task explicitly targets them.

## Build and Test
- Frontend setup/run:
  - cd src/frontend
  - npm install
  - npm start
- Frontend build/test:
  - cd src/frontend
  - npm run build
  - npm test
- Backend setup/run:
  - cd src/backend
  - npm install
  - npm run dev
- Backend production build/start:
  - cd src/backend
  - npm run build
  - npm run start
- Start backend before frontend when working on API-driven pages.

## Conventions
- Use the callAPI helper for frontend HTTP requests; pass endpoint paths like /login, /chats, /chat/:chatID and let the helper add the /api base.
- For POST requests, send JSON.stringify(...) bodies to match the current fetch wrapper usage.
- Backend responses should use the existing status + content response shape (generateResponse + shared Status codes).
- Preserve session-based auth behavior: unauthenticated requests return USER_NOT_LOGGED_IN and frontend routes typically redirect to /.

## References
- General CRA script behavior is documented in README.md.
- Pending architecture/security ideas and future tasks are tracked in TODO.md.
