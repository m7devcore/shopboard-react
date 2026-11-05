# CLAUDE.md — ShopBoard React Engineering & Architecture Guidelines

This document defines the architectural boundaries, coding standards, and factual debugging rules for **ShopBoard React** (`shopboard-react`). All contributors and AI agents must follow these rules when inspecting, testing, or modifying the codebase.

---

## 1. Protected Day 3 Domain Modules (Read-Only)

The following eight modules were migrated verbatim from the Day 3 TypeScript storefront and **must never be modified** (enforced via SHA256 parity verification):

- `src/shared/api/client.ts` (`17a60918567890a840a5de5e737a1793c5dbd1edd7cd09ab73f79ee3c0e7ecb7`)
- `src/modules/products/products.types.ts` (`ebc02df52fdbb8c0ee8996010a901c2ee9e5f8fdfb9f15a05574e4f5c22bbc42`)
- `src/modules/products/products.api.ts` (`a88ed7e94d7b4740c96a99f8091b6dd7d793dc17348ec2d1d71e75b1cb760145`)
- `src/modules/products/products.logic.ts` (`8536e08c6eb2272a244d39add59ada5a47004cb0bcc1721f9cb7642287e8314b`)
- `src/modules/cart/cart.types.ts` (`1364410c7a9185b4b2631628f9a8ac49142bbee122be0be21e8916d5efbe3c83`)
- `src/modules/cart/cart.logic.ts` (`ccf50c0e879d629470156c376be63ffda9320c0ea30ce143a36218417f0d500a`)
- `src/modules/cart/cart.state.ts` (`328c64f04853a3c047902073243525d7e2ff8e1dde3dbef1eb681c0efb74c2cd`)
- `src/modules/artworks/artworks.types.ts` (`6d61e4efe09c7bbd67eeec9fba7b9708cda16be78b22b249fb8d8fbc846c8c21`)

Do not duplicate product filtering, price sorting, `price_cents` conversion, `localStorage` persistence, or cart arithmetic inside React components. Always import and delegate to these modules.

---

## 2. Installed Vercel React Skills

This repository includes two reference skill libraries under `.claude/skills/` that govern component composition and React 19 performance:

1. **`.claude/skills/vercel-composition-patterns`** — Lifting state, decoupling state implementation from presentation, explicit component variants over boolean prop proliferation, and React 19 ref handling.
2. **`.claude/skills/vercel-react-best-practices`** — Lazy state initialization (`rerender-lazy-state-init`), deriving state during render (`rerender-derived-state-no-effect`), and keeping side effects inside event handlers (`rerender-move-effect-to-event`).

---

## 3. Factual Engineering Rules from Observed Project Issues

### Rule 1: Never Call Synchronous `setState` at the Start of `useEffect` (`oxlint` `react(set-state-in-effect)`)

- **Observed Issue**: Calling `setLoadState({ status: 'loading' })` synchronously inside `useEffect` before calling `getProducts()` triggered Oxlint's `react(set-state-in-effect)` error and caused redundant render passes.
- **Required Pattern**: Initialize `loadState` directly to `{ status: 'loading' }` in `useState`, and transition back to `{ status: 'loading' }` inside the `handleRetry` click handler before incrementing `retryCounter`. Inside `useEffect`, only call `setLoadState` asynchronously in `.then()` / `.catch()` guarded by `let isCurrent = true`.

### Rule 2: Call Side-Effecting Cart Mutators Only in Event Handlers (Never in State Updaters or Render)

- **Observed Issue**: The preserved `cart.state.ts` functions (`addToCart`, `increaseQuantity`, `decreaseQuantity`, `removeFromCart`, `clearCart`) mutate an in-memory singleton (`cartState`) and write to `localStorage`. In React 19 `<StrictMode>`, state updater functions (`setCart(prev => ...)`) and render bodies are invoked twice in development mode to detect impure logic, which would double-increment quantities if mutators were placed inside them.
- **Required Pattern**:
  1. Initialize cart state lazily: `const [cart, setCart] = useState<Cart>(() => initializeCartState())`.
  2. Execute cart mutators once inside event handlers, capture the returned shallow-copied `Cart` array, and pass it directly to `setCart(updatedCart)`:
     ```ts
     const handleIncreaseCartItem = useCallback((productId: string) => {
       const updatedCart = increaseQuantity(productId)
       setCart(updatedCart)
     }, [])
     ```

### Rule 3: React `<StrictMode>` Double-Mount vs. Single-Use `fail_once` Flags

- **Observed Issue**: In development mode (`npm run dev`), `<StrictMode>` runs the mount `useEffect` twice (`mount -> cleanup -> remount`). When testing with `?api_mode=fail_once`, the module-level `failOnceConsumed` boolean in `products.api.ts` is consumed by the first mount's rejected promise (which is ignored by the cleanup flag `isCurrent = false`), and the second mount immediately succeeds—hiding the error state in dev mode.
- **Required Pattern**: Always include the `isCurrent` cleanup boolean in `useEffect` to prevent stale state updates on unmounted/remounted trees, and use `?api_mode=fail` (or controllable local fixture status codes) when testing error and retry UI under `<StrictMode>`.

### Rule 4: Keep `ProductList` Purely Presentational; Own Empty-State Branching in `App`

- **Observed Issue**: Placing an empty-list fallback inside `ProductList` conflates two distinct UX states: an empty API catalog (`empty-catalog`, where `ProductToolbar` should not render) and an empty filter/search match (`empty-filter`, where `ProductToolbar` **must** remain rendered so the user can edit or clear their search query).
- **Required Pattern**: `ProductList` only renders `<ul className="product-grid">`. `App` branches between `<StatusMessage variant="empty-catalog" />` and `<StatusMessage variant="empty-filter" />`.

### Rule 5: Native `<dialog>` Lifecycle & Controlled `Escape` / Backdrop Synchronization

- **Observed Issue**: Native HTML `<dialog>` opened with `.showModal()` can close natively on `Escape` without updating React's `isCartOpen` state unless the `cancel` event is intercepted.
- **Required Pattern**: In `CartPanel.tsx`, attach `onCancel={(e) => { e.preventDefault(); onClose(); }}` so React state (`isCartOpen`) remains the single source of truth, and detect backdrop clicks using `dialog.getBoundingClientRect()` coordinate bounds. Ensure all interactive controls (`.btn-qty`, `.btn-remove-item`, `.btn-close-cart`, `.btn-clear-cart`) maintain at least `44×44px` touch target dimensions.

### Rule 6: Automated Browser Testing with React Controlled Inputs & CDP Targets

- **Observed Issue**:
  1. Direct DOM assignment (`input.value = 'Leather'`) does not trigger React 19's `onChange` handler because React tracks the native `HTMLInputElement.prototype.value` setter.
  2. Querying `http://127.0.0.1:<port>/json/list` in Edge CDP can return internal background targets (e.g., `Microsoft Voices` extension) at `pages[0]`.
- **Required Pattern**:
  1. Always select the page target via `pages.find(p => p.type === 'page')`.
  2. Trigger controlled input changes via `Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, value)` followed by `input.dispatchEvent(new Event('input', { bubbles: true }))`.

---

## 4. Pre-Commit & Quality Commands

Every change must pass all five checks before committing:

```bash
npm run typecheck    # tsc -b
npm run lint         # oxlint --deny-warnings
npm run format:check # prettier --check .
npm run build        # tsc -b && vite build
git diff --check     # verify no whitespace/conflict markers
```
