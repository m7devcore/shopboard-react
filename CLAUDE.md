# CLAUDE.md — ShopBoard React Engineering & Architecture Guidelines

This document defines the architectural boundaries, coding standards, and project-specific engineering rules for **ShopBoard React** (`shopboard-react`). All contributors and AI agents must follow these rules when inspecting, testing, or modifying the codebase.

---

## 1. Project Overview & Directory Architecture

ShopBoard is a production-grade React 19 storefront application built with Vite and TypeScript.

```text
src/
├── components/ui/             # Official shadcn/ui primitives (button, field, input, label)
├── features/
│   ├── cart/                  # Shopping cart domain (CartProvider, hooks, storage, pure logic)
│   ├── checkout/              # Validated checkout (Zod schema, types, unit tests)
│   └── products/              # Catalog domain (adapter, hooks, toolbar, card, grid)
├── pages/                     # Lazy-loaded page routes (Home, Catalog, Details, Cart, Checkout, 404)
├── shared/
│   ├── api/                   # Secure signal transport, origin validation, client
│   └── components/            # Shell layout, Header, ErrorBoundary, RouteLoadingSpinner, StatusMessage
├── modules/                   # Eight protected Day 3 historical modules (Read-only)
├── index.css                  # Global theme and component styles
└── main.tsx                   # Application entry point mounting App inside React.StrictMode
```

---

## 2. Protected Day 3 Domain Modules (Read-Only)

The following eight modules were migrated verbatim from the Day 3 TypeScript storefront and **must never be modified** (enforced via SHA256 parity verification):

- `src/shared/api/client.ts` (`17a60918567890a840a5de5e737a1793c5dbd1edd7cd09ab73f79ee3c0e7ecb7`)
- `src/modules/products/products.types.ts` (`ebc02df52fdbb8c0ee8996010a901c2ee9e5f8fdfb9f15a05574e4f5c22bbc42`)
- `src/modules/products/products.api.ts` (`a88ed7e94d7b4740c96a99f8091b6dd7d793dc17348ec2d1d71e75b1cb760145`)
- `src/modules/products/products.logic.ts` (`8536e08c6eb2272a244d39add59ada5a47004cb0bcc1721f9cb7642287e8314b`)
- `src/modules/cart/cart.types.ts` (`1364410c7a9185b4b2631628f9a8ac49142bbee122be0be21e8916d5efbe3c83`)
- `src/modules/cart/cart.logic.ts` (`ccf50c0e879d629470156c376be63ffda9320c0ea30ce143a36218417f0d500a`)
- `src/modules/cart/cart.state.ts` (`328c64f04853a3c047902073243525d7e2ff8e1dde3dbef1eb681c0efb74c2cd`)
- `src/modules/artworks/artworks.types.ts` (`6d61e4efe09c7bbd67eeec9fba7b9708cda16be78b22b249fb8d8fbc846c8c21`)

---

## 3. Project-Specific Engineering Lessons Learned

All code modifications and new feature additions must strictly adhere to these nine factual lessons learned:

### Lesson 1: Validate Raw API Category Values Before Historical Mapping

- **Rule**: Never trust external API payloads to adhere strictly to TypeScript union types. Always validate raw string values at the boundary using `isKnownCategory(rawCategory)` or explicit zod/guard parsers before casting or mapping into domain categories.
- **Why**: Malformed or unexpected category strings from upstream APIs cause silent rendering regressions or break category filter tabs unless rejected or mapped explicitly.

### Lesson 2: Never Accept API Origins from Query Parameters

- **Rule**: Do not read `window.location.search` (e.g. `?api_base=`) to determine the target API origin in active application code. Active transport (`src/shared/api/transport.ts`) must strictly validate origins against `isAllowedOrigin()` and use verified build-time configuration (`VITE_API_BASE_URL` or canonical production default).
- **Why**: Accepting untrusted query parameters allows attackers to redirect application fetch calls to malicious external servers (`?api_base=https://attacker.invalid`), exposing credentials or injecting malicious data.

### Lesson 3: Abort Stale Requests on Effect Cleanup

- **Rule**: Every `useEffect` that initiates an asynchronous network request must instantiate an `AbortController`, pass its `signal` to the fetch transport, and invoke `controller.abort()` in its cleanup function.
- **Why**: Prevents race conditions and unmounted state update warnings when users navigate rapidly between pages or type rapidly in search/filter inputs.

### Lesson 4: Use One Shared Cart State Owner

- **Rule**: All cart state must be owned by the single top-level `CartProvider` (`src/features/cart/CartProvider.tsx`). Individual page routes (`CartPage`, `CheckoutPage`, `ProductDetailsPage`, `CatalogPage`) and navigation drawers must access cart data exclusively via `useCart()`.
- **Why**: Maintaining separate cart state instances across pages leads to state desynchronization, stale item counts, and dropped line items during page navigation.

### Lesson 5: Keep Derived Data Out of Unnecessary State

- **Rule**: Do not store values in React `useState` that can be computed synchronously from existing props or state (e.g., `totalItems`, `totalPrice`, `filteredProducts`, `availableCategories`). Calculate them during render or memoize them with `useMemo`.
- **Why**: Mirroring derived data into state introduces redundant re-render passes, causes out-of-sync visual states, and violates Oxlint's React performance rules.

### Lesson 6: Avoid Explicit TypeScript `any`

- **Rule**: Never use explicit `any` in application or test code. Use `unknown`, generics, or discriminating union types, and validate values with type guards. Enforced by Oxlint rule `"typescript/no-explicit-any": "error"` in `.oxlintrc.json` and pre-commit hooks.
- **Why**: `any` disables the TypeScript type checker, masking runtime bugs and invalid prop contracts.

### Lesson 7: Preserve Accessible Form and Dialog Behavior

- **Rule**:
  1. Native `<dialog>` elements must intercept `cancel` (`onCancel={(e) => { e.preventDefault(); onClose(); }}`) to synchronize React state with Escape key dismissals.
  2. All form controls must have associated `<FieldLabel htmlFor={id}>` components.
  3. Form validation errors must have `role="alert"` / `aria-live="polite"` and set `aria-invalid="true"` on invalid inputs.
  4. Failed form submission must automatically move focus to the first invalid input.
  5. Interactive controls must maintain a minimum touch target size of 44×44px.
- **Why**: Ensures WCAG 2.1 AA accessibility compliance and seamless assistive technology navigation.

### Lesson 8: Do Not Claim Tests Passed Without Running Them

- **Rule**: Always run the relevant test commands (`npm test`, `npm run typecheck`, `npm run lint`) and inspect the actual unmodified terminal output before reporting status. Never invent test counts or claim a passing grade without empirical evidence.
- **Why**: Premature or hallucinated claims of success hide regressions, mislead reviewers, and fail automated quality gates.

### Lesson 9: Explain Every Code Change and Avoid Unnecessary Files

- **Rule**:
  1. Only modify or create files that directly serve a specific, required acceptance criterion.
  2. Do not leave temporary scripts, backup files (`.bak`, `.tmp`), or scratch files tracked in Git.
  3. Every pull request or submission report must provide an exact list of changed files with a concise, factual explanation of **what** changed, **where**, and **why**.
- **Why**: Keeps the repository clean, auditable, and free of extraneous bloat.

---

## 4. Pre-Commit & Quality Commands

Every change must pass all six quality gates before committing:

```bash
# 1. Unit & integration tests
npm test

# 2. TypeScript compilation
npm run typecheck

# 3. Linter (Oxlint with zero warnings allowed)
npm run lint

# 4. Code formatting check (Prettier)
npm run format:check

# 5. Production build check
npm run build

# 6. Git whitespace and patch integrity
git diff --check
```
