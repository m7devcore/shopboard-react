# ShopBoard React

A modern, type-safe React storefront application built with React 19, TypeScript, and Vite.

## Current Stage: Stage 1 — Project Setup & Tooling

This repository hosts the foundational client scaffold and tooling configuration for ShopBoard.

### Tech Stack & Tooling

- **Framework**: React 19 (`react`, `react-dom`)
- **Bundler & Dev Server**: Vite 8 with `@vitejs/plugin-react`
- **Language**: TypeScript 7 configured with strict mode enabled (`noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`)
- **Linter**: Oxlint configured with React and TypeScript rules (`--deny-warnings`)
- **Formatter**: Prettier
- **Git Hooks**: Husky with `lint-staged` for pre-commit linting and formatting
- **Agent Skills**: Tracked in `.claude/skills/` (`vercel-react-best-practices`, `vercel-composition-patterns`)

---

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0

### Installation

Clone the repository and install dependencies reproducibly:

```bash
npm ci
```

---

## Available Scripts

| Script         | Command                  | Description                                                                                |
| -------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| `dev`          | `vite`                   | Starts the Vite development server with Hot Module Replacement (HMR).                      |
| `build`        | `tsc -b && vite build`   | Type-checks the project and creates an optimized production bundle in `dist/`.             |
| `lint`         | `oxlint --deny-warnings` | Runs Oxlint across project files, enforcing zero warnings and zero errors.                 |
| `format`       | `prettier --write .`     | Formats all project files matching Prettier rules.                                         |
| `format:check` | `prettier --check .`     | Verifies that all project files adhere to Prettier formatting.                             |
| `typecheck`    | `tsc -b`                 | Executes TypeScript project reference type-checking in strict mode without emitting files. |
| `preview`      | `vite preview`           | Previews the production build locally.                                                     |
