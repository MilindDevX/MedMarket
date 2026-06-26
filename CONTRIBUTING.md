# Contributing to MedMarket India

Thank you for taking the time to contribute. This document covers setup, branch conventions, and the PR checklist.

---

## Local Setup

```bash
# 1. Clone
git clone https://github.com/MilindDevX/MedMarket.git
cd medmarket

# 2. Backend
cd backend
cp .env.example .env          # fill in your values
#   Required: DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
#   Required for AI: GEMINI_API_KEY (aistudio.google.com — free)
#   Optional AI fallback: GROQ_API_KEY (console.groq.com — free, auto-used on Gemini quota)
npm install
npx prisma migrate deploy
npx prisma generate
npm run db:seed
npm run dev                   # http://localhost:3000

# 3. Frontend (separate terminal)
cd ../frontend
cp .env.example .env          # set VITE_API_URL=http://localhost:3000/api/v1
npm install
npm run dev                   # http://localhost:5173
```

Or use Docker Compose (requires Docker Desktop):

```bash
cp backend/.env.example backend/.env   # fill in Cloudinary + JWT secrets
docker compose up --build
```

The backend will be available at `http://localhost:3000` and swagger docs at `http://localhost:3000/api/docs`.

---

## Branch Naming

| Type | Pattern | Example |
|---|---|---|
| Feature | `feat/<short-description>` | `feat/expiry-risk-score` |
| Bug fix | `fix/<short-description>` | `fix/pharmacy-null-status-crash` |
| Chore / refactor | `chore/<short-description>` | `chore/upgrade-prisma-7` |
| Documentation | `docs/<short-description>` | `docs/swagger-annotations` |

All branches must target `main`.

---

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(inventory): add expiry risk score column
fix(auth): handle null pharmacyStatus on Google OAuth login
chore(ci): add typecheck and lint steps
docs(readme): add CI badge
```

---

## Pull Request Checklist

Before opening a PR, confirm all of the following:

- [ ] `npm run typecheck` passes in `backend/`
- [ ] `npm test` passes in both `backend/` and `frontend/`
- [ ] New behaviour has test coverage (or an explanation for why it doesn't)
- [ ] No new `console.log` left in production code
- [ ] Environment variables are added to `.env.example` (never to `.env`)
- [ ] Migrations are included if the Prisma schema changed (`npx prisma migrate dev --name <desc>`)
- [ ] The PR description explains **what** changed and **why**

---

## Code Style

- **Backend:** TypeScript strict mode. Controllers stay thin — business logic belongs in services/repositories. Use the `sendSuccess` / `sendError` helpers from `src/utils/response.ts`.
- **AI calls:** Always use `generateWithFallback()` from `src/lib/ai.ts` — never call `getFlashModel()` directly in new code. The fallback layer handles Gemini quota errors automatically.
- **Frontend:** React functional components with hooks. CSS Modules only — no inline styles unless dynamically computed. Follow the existing token system in `src/styles/tokens.css`.
- **No `any`** in TypeScript without a comment explaining why.

---

## Running Tests

```bash
# Backend (38 unit tests)
cd backend && npm test

# Frontend (20 unit tests)
cd frontend && npm test

# Coverage
cd backend  && npm run test:coverage
cd frontend && npm run test:coverage
```

---

## API Docs

The full interactive API reference is available at `http://localhost:3000/api/docs` when the backend is running.
