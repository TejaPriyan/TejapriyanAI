# Contributing to Teja Priyan AI

Thank you for your interest in contributing to **Teja Priyan AI**! We welcome contributions, feature suggestions, bug reports, and enhancements.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Branching Strategy](#-branching-strategy)
- [Code Guidelines](#-code-guidelines)
- [Commit Conventions](#-commit-conventions)
- [Testing](#-testing)
- [Submitting Pull Requests](#-submitting-pull-requests)
- [Reporting Bugs](#-reporting-bugs)
- [Requesting Features](#-requesting-features)

---

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold a welcoming, respectful, and inclusive environment.

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A running **PostgreSQL** instance (or use the provided Docker setup)

### Setup

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/TejapriyanAI.git
   cd TejapriyanAI
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Set up your environment:**
   ```bash
   cp .env.example .env
   ```
   Fill in the required API keys and database URL in `.env`.

5. **Set up the database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

6. **Start the local dev server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

---

## 📁 Project Structure

```
TejapriyanAI/
├── app/                  # Next.js App Router pages & API routes
├── components/           # Reusable React components
├── lib/                  # Utility functions, API clients, helpers
├── prisma/               # Prisma schema & migrations
├── public/               # Static assets (images, icons)
├── .env.example          # Environment variable template
├── next.config.js        # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies & scripts
```

---

## 🌿 Branching Strategy

Always branch from `main`:

```bash
git checkout main
git pull origin main
git checkout -b <type>/<description>
```

### Branch naming convention:

| Prefix | Purpose | Example |
|:---|:---|:---|
| `feature/` | New feature | `feature/voice-input-support` |
| `fix/` | Bug fix | `fix/chat-scroll-overflow` |
| `refactor/` | Code cleanup | `refactor/api-client-structure` |
| `docs/` | Documentation | `docs/update-setup-guide` |
| `chore/` | Build, CI, deps | `chore/upgrade-prisma-5` |

---

## 📝 Code Guidelines

### TypeScript
- **Strict typing**: All new code must be strictly typed — no `any` unless absolutely necessary (and justified in a comment).
- **Interfaces over types**: Prefer `interface` for object shapes; use `type` for unions, intersections, and primitives.

### Styling
- Use **Tailwind CSS** following existing design tokens and color scales.
- Do not introduce new color values — use the `tailwind.config.ts` palette.
- Component-level styles belong in the component file; do not create separate `.css` files.

### Components
- Use **Server Components** by default; add `'use client'` only when needed (interactivity, hooks, browser APIs).
- Keep components small and focused — one responsibility per component.
- Place shared components in `components/`, page-specific ones alongside their page in `app/`.

### Validation
Before submitting a Pull Request, verify that the project builds and lints cleanly:
```bash
npm run lint
npm run build
```

---

## 📝 Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]
[optional footer]
```

### Types:

| Type | Description |
|:---|:---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes only |
| `style` | Code formatting (no logic change) |
| `refactor` | Code restructuring (no feature/fix) |
| `test` | Adding or fixing tests |
| `chore` | Build, CI, dependency updates |
| `perf` | Performance improvements |

### Examples:
```bash
git commit -m "feat(chat): add streaming response with SSE"
git commit -m "fix(auth): handle expired session token gracefully"
git commit -m "refactor(lib): extract API client into separate module"
```

---

## 🧪 Testing

While the test suite is evolving, please:

- **Manually test** your changes across different screen sizes (responsive layout).
- **Verify** that existing features are not broken by your changes.
- **Test API routes** using tools like `curl`, Postman, or the built-in Prisma Studio:
  ```bash
  npx prisma studio
  ```

If adding tests:
```bash
npm test
```

---

## 📬 Submitting Pull Requests

1. **Commit** your changes with clear messages following conventions above.
2. **Push** your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
3. **Open a Pull Request** targeting the `main` branch.

### PR Description Template:
```markdown
## What does this PR do?
Brief description of the change.

## Why is this needed?
Context and motivation.

## How to test
Step-by-step instructions to verify the change.

## Screenshots (if applicable)
Before/after screenshots for UI changes.

## Related Issues
Fixes #<issue_number>
```

### PR Checklist:
- [ ] Code lints cleanly (`npm run lint`)
- [ ] Project builds successfully (`npm run build`)
- [ ] No `any` types introduced without justification
- [ ] Responsive design tested on mobile and desktop
- [ ] Environment variables documented in `.env.example` if added
- [ ] Prisma schema changes include a migration
- [ ] Commit messages follow Conventional Commits
- [ ] README updated if behavior changes

---

## 🐛 Reporting Bugs

Found a bug? Please [open an issue](https://github.com/TejaPriyan/TejapriyanAI/issues/new) with:

- **Title**: Brief, descriptive summary
- **Environment**: Browser, OS, Node.js version
- **Steps to reproduce**: Numbered list of actions
- **Expected behavior**: What should have happened
- **Actual behavior**: What actually happened
- **Screenshots/Logs**: Console errors, network tab output, or UI screenshots
- **Severity**: Critical / Major / Minor / Cosmetic

---

## 💡 Requesting Features

Have an idea? [Open a feature request](https://github.com/TejaPriyan/TejapriyanAI/issues/new) with:

- A clear, concise description of the feature
- The problem it solves or the use case it enables
- Any mockups, wireframes, or reference examples
- Whether you'd be willing to implement it yourself

---

## 🙏 Thank You!

Every contribution makes **Teja Priyan AI** better. Whether you're fixing a typo, improving accessibility, or building a major feature — **you're valued and appreciated!**
