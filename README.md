# API Platform

![CI](https://github.com/casper-justus/api-platform/actions/workflows/ci.yml/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Description

Built a production-grade REST API with JWT authentication, refresh token rotation, rate limiting, and auto-generated OpenAPI documentation, using TypeScript, Express, Drizzle ORM, and PostgreSQL.

## Features

- JWT authentication with access/refresh token rotation
- Role-based CRUD for users, projects, and tasks
- Rate limiting and HTTP security headers
- Input sanitization and Zod validation
- Auto-generated Swagger/OpenAPI documentation
- GitHub Actions CI/CD pipeline
- One-click Railway deployment

## Tech Stack

| Technology | Purpose |
|------------|---------|
| TypeScript | Strongly typed JavaScript |
| Express | Web framework |
| Drizzle ORM | Type-safe SQL ORM |
| PostgreSQL | Relational database |
| Helmet | Security headers |
| express-rate-limit | Rate limiting |
| Zod | Request validation |
| JWT | Authentication |
| Jest | Testing |
| Swagger UI | API documentation |

## API Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Revoke refresh token |

### Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users/me` | Get current user profile | Yes |
| PUT | `/api/users/me` | Update profile | Yes |
| PUT | `/api/users/me/password` | Change password | Yes |

### Projects

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/projects` | List projects (paginated) | Yes |
| GET | `/api/projects/:id` | Get project by ID | Yes |
| POST | `/api/projects` | Create project | Yes |
| PUT | `/api/projects/:id` | Update project | Yes |
| DELETE | `/api/projects/:id` | Delete project | Yes |

### Tasks

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/tasks` | List tasks (paginated) | Yes |
| GET | `/api/tasks/:id` | Get task by ID | Yes |
| POST | `/api/tasks` | Create task | Yes |
| PUT | `/api/tasks/:id` | Update task | Yes |
| DELETE | `/api/tasks/:id` | Delete task | Yes |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+

### Installation

```bash
git clone https://github.com/casper-justus/api-platform.git
cd api-platform
npm install
```

### Configuration

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

### Database Setup

```bash
npm run db:migrate
```

### Run the Server

```bash
npm start
```

API runs at `http://localhost:3000`
- Swagger docs: `http://localhost:3000/api-docs`
- Health check: `http://localhost:3000/health`

### Running Tests

```bash
npm test
```

## Environment Variables

All required variables — set these in the Railway **Variables** tab or in your local `.env` file.

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string. Auto-injected by the Railway PostgreSQL plugin. | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | ✅ | Secret key for signing access tokens. Use a long random string. | `openssl rand -hex 64` |
| `JWT_REFRESH_SECRET` | ✅ | Separate secret for signing refresh tokens. **Must differ from `JWT_SECRET`.** | `openssl rand -hex 64` |
| `JWT_EXPIRES_IN` | ✅ | Access token lifetime. Keep short for security. | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | ✅ | Refresh token lifetime. | `7d` |
| `PORT` | ✅ | Port the server listens on. Railway injects this automatically. | `3000` |
| `NODE_ENV` | ✅ | Runtime environment. | `production` |
| `CORS_ORIGIN` | Optional | Allowed CORS origin. Defaults to `*`. Set to your frontend URL in production. | `https://your-frontend.vercel.app` |

> **Tip:** Generate secure secrets with `openssl rand -hex 64` and never reuse the same value for `JWT_SECRET` and `JWT_REFRESH_SECRET`.

## Project Structure

```
api-platform/
├── .github/workflows/ci.yml    # CI/CD pipeline
├── src/
│   ├── app.ts                  # Express app setup
│   ├── config/
│   │   └── swagger.ts          # Swagger configuration
│   ├── db/
│   │   ├── connection.ts       # Database connection
│   │   ├── middleware/         # Auth, validation, security
│   │   ├── migrations/         # Drizzle migrations
│   │   └── schema/             # Drizzle schema definitions
│   └── modules/
│       ├── auth/               # Authentication logic
│       ├── users/              # User endpoints
│       ├── projects/           # Project endpoints
│       └── tasks/              # Task endpoints
├── test/                       # Test suites
├── .env.example                # Environment template
├── drizzle.config.ts           # Drizzle configuration
├── jest.config.json            # Jest configuration
├── railway.json                # Railway deployment config
└── tsconfig.json               # TypeScript configuration
```

## Deploy to Railway

1. Sign up at [Railway](https://railway.app)
2. Connect your GitHub repository
3. Add a **PostgreSQL** database service — Railway will auto-inject `DATABASE_URL`
4. Set all required environment variables from the table above in the **Variables** tab
5. Deploy — Railway handles build and start automatically

## License

MIT
