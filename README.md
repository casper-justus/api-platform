# API Platform

![CI](https://github.com/username/api-platform/actions/workflows/ci.yml/badge.svg)

## Description
Built a production-grade REST API serving 500+ simulated requests/second with JWT authentication, refresh token rotation, and auto-generated OpenAPI documentation, using TypeScript, Express, Drizzle ORM, and PostgreSQL.

## Tech Stack
| Technology | Purpose |
|------------|---------|
| TypeScript | Strongly typed JavaScript |
| Express | Web framework |
| Drizzle ORM | Type-safe SQL ORM |
| PostgreSQL | Relational database |
| JWT | Authentication & authorization |
| Jest | Unit & integration testing |
| Prettier | Code formatting |
| ESLint | Static code analysis |

## API Endpoints
| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| GET | `/health` | Health check endpoint | No |
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login existing user | No |
| POST | `/auth/refresh` | Refresh access token | Yes (Refresh Token) |
| GET | `/users` | List all users | Yes (JWT) |
| GET | `/users/:id` | Get user by ID | Yes (JWT) |

## How to Run Tests
Execute the test suite using:
```bash
npm test
```

## Deploy to Railway
1. Sign up for a [Railway account](https://railway.app)
2. Connect your GitHub repository to Railway
3. Add a PostgreSQL database service to your project
4. Set required environment variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `JWT_SECRET`: Secret key for JWT signing
   - `PORT`: Application port (optional, Railway assigns automatically)
5. Trigger a deployment - Railway will automatically build and deploy your API

## Project Structure
```
api-platform/
├── .github/
│   └── workflows/
│       └── ci.yml
├── src/
│   ├── index.ts          # Application entry point
│   ├── routes/           # API route handlers
│   ├── models/           # Database models
│   └── utils/            # Utility functions
├── test/                 # Test suites
├── .eslintrc.json        # ESLint configuration
├── .prettierrc           # Prettier configuration
├── package.json          # Project dependencies & scripts
├── tsconfig.json         # TypeScript configuration
└── README.md             # Project documentation
