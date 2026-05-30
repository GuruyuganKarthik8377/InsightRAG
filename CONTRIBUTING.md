# Contributing to InsightRAG

Thank you for your interest in contributing to InsightRAG! We appreciate your time and help in making this a production-grade RAG pipeline.

To maintain code quality, security, and repository integrity, please read and follow these guidelines.

---

## Code of Conduct

We expect all contributors to maintain a respectful, inclusive, and professional environment. Please be constructive and supportive in code reviews, discussions, and issues.

---

## How Can I Contribute?

### 1. Reporting Bugs
* Check the existing Issues to make sure the bug hasn't been reported.
* Create a new Issue detailing:
  - Clear steps to reproduce the issue.
  - Expected behavior vs. actual behavior.
  - Environment details (OS, Python version, Node.js version, browser).
  - Relevant logs or stack traces.

### 2. Suggesting Features
* Open an Issue with the prefix `[Feature Request]`.
* Provide a clear description of the feature, the problem it solves, and potential implementation ideas.

### 3. Submitting Pull Requests
* Fork the repository and create your feature branch from `main`:
  ```bash
  git checkout -b feature/amazing-new-feature
  ```
* Write clean, self-documenting code.
* Ensure no secrets, API keys, or machine-specific directories are hardcoded.
* Verify your changes locally (see testing details below).
* Push your branch to GitHub and open a Pull Request (PR) against `main`.

---

## Coding Standards & Style Guides

### Python Backend
* **Standard:** Adhere to **PEP 8**.
* **Docstrings:** Use Google-style or standard Sphinx docstrings for classes, functions, and routes.
* **Logging:** Avoid using `print()` statements in runtime code. Use Python's built-in `logging` module (`logging.info()`, `logging.error()`, etc.).
* **Imports:** Clean, sorted imports (Standard Library -> Third-party dependencies -> Local modules).

### React / TypeScript Frontend
* **TypeScript:** Ensure strict type checking passes (`tsc -b` should run without errors).
* **Styling:** Adhere to modern Tailwind CSS structure. Reuse existing styling tokens and HSL palettes rather than creating ad-hoc layout parameters.
* **State Management:** Use Zustand stores strictly as designed. Do not write side-effects directly inside UI files; perform them through actions.

---

## Local Verification Checklist

Before submitting a Pull Request, please verify your changes pass local checks:

1. **Verify Backend (FastAPI):**
   Ensure dependencies are updated in `requirements.txt` if new packages are introduced. Run the FastAPI development server locally to confirm startup.
2. **Verify Frontend (Vite/React):**
   ```bash
   cd frontend
   npm run build
   ```
   Ensure there are no TypeScript compiler or bundler failures.

3. **Check for Hardcoded Secrets:**
   Double-check that no API keys, credentials, or personal emails are committed. Make sure your local credentials are kept strictly in `backend/.env`.

---

## Licensing
By contributing, you agree that your contributions will be licensed under the project's **MIT License**.
