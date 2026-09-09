# Contributing to Teja Priyan AI

Thank you for your interest in contributing to **Teja Priyan AI**! We welcome contributions, feature suggestions, bug reports, and enhancements.

---

## 🛠️ Getting Started

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
5. **Start the local dev server:**
   ```bash
   npm run dev
   ```

---

## 🌿 Branching Strategy

* Create a descriptive feature branch:
  ```bash
  git checkout -b feature/your-feature-name
  # or
  git checkout -b fix/issue-description
  ```

---

## 📝 Code Guidelines

* **TypeScript:** Ensure all new code is strictly typed.
* **Styling:** Use Tailwind CSS following existing design tokens and color scales.
* **Validation:** Before submitting a Pull Request, verify that the project builds and lints cleanly:
  ```bash
  npm run lint
  npm run build
  ```

---

## 📬 Submitting Pull Requests

1. Commit your changes with clear, descriptive commit messages:
   ```bash
   git commit -m "feat: add support for custom code export format"
   ```
2. Push your branch to GitHub:
   ```bash
   git push origin feature/your-feature-name
   ```
3. Open a **Pull Request** targeting the `main` branch.
4. Describe your changes clearly in the PR description.

---

## 🐛 Reporting Bugs

If you find a bug:
1. Search [existing GitHub issues](https://github.com/TejaPriyan/TejapriyanAI/issues) to see if it's already reported.
2. If not, open a new issue detailing:
   * Steps to reproduce
   * Expected vs. actual behavior
   * Your browser, OS, and environment
