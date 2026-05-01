# Contributing

Thank you for your interest in contributing! Contributions are welcome in the form of bug reports, new endpoints, auth improvements, test coverage, and documentation fixes.

## Getting Started

1. **Fork** the repository and create a new branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and configure your local database.
4. Run tests to make sure everything passes:
   ```bash
   npm test
   ```
5. Open a **Pull Request** against `main` with a clear description of what changed and why.

## What You Can Contribute

- 🔐 **Auth improvements** — refresh tokens, OAuth, role-based access control
- 📦 **New endpoints** — additional REST resources following existing patterns
- 🧪 **Tests** — unit and integration test coverage with Jest
- 📚 **Documentation** — API docs, Swagger/OpenAPI spec improvements
- 🐛 **Bug fixes** — Prisma query issues, validation errors, response formatting

## Pull Request Guidelines

- Keep PRs focused — one change per PR
- Use clear commit messages (e.g. `feat: add refresh token endpoint`)
- All new endpoints must have corresponding Jest tests
- Never commit `.env` files or secrets

## Reporting Issues

When reporting a bug, please include:
- The request method, route, and body that triggered the issue
- The error response or stack trace
- Node.js and npm versions

## Code of Conduct

Be respectful and constructive. Everyone is welcome regardless of experience level.
