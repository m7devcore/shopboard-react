# Debug Lab Log — CorePro Day 4 (`https://shopboard-api.vercel.app/debug-lab`)

## 1. Access & Reproduction Method

- **Target URL**: `https://shopboard-api.vercel.app/debug-lab`
- **Network Observation**: Direct CLI requests (`curl.exe -i -m 8`) and initial browser navigations encountered intermittent TCP connection resets (`net::ERR_CONNECTION_RESET` / `curl: (28) Connection timed out`). During automated headless Microsoft Edge navigation via Chrome DevTools Protocol (CDP), Edge's automatic retry loaded the page (`"DEBUG LAB · PAIRS — It compiles. It still has 5 bugs. This small shop is written in React and TypeScript. tsc shows zero errors. It still has 5 bugs. Find them with React DevTools and the Console."`) and cached the unminified Vite development bundle (`/debug-lab/assets/index-CbYUo1e8.js` and `/debug-lab/assets/index-_uY36eBd.css`).
- **Verification Environment**: The cached Vite development bundle (containing full unminified React 19 development runtime, `_jsxFileName` source metadata, and all `src/` modules) was extracted and executed in headless Microsoft Edge under CDP to inspect live Console warnings, React Fiber state, and DOM mutations across all five bugs.

---

## 2. The 5 Bugs: Symptom, Root Cause & Fix

### Bug 1 — Missing `key` Prop in `CategoryChips` List Rendering

- **Location**: `src/components/CategoryChips.tsx` (lines 7–11)
- **Symptom**:
  - Immediately on initial page load, the browser Console logs a React error:
    ```text
    Each child in a list should have a unique "key" prop. See https://react.dev/link/warning-keys for more information.
    Check the render method of `CategoryChips`.
    ```
- **Root Cause**:
  - `CategoryChips` maps over `categories` without providing a `key` prop to each rendered `<span className="chip">` element:
    ```tsx
    export function CategoryChips({ categories }: { categories: string[] }) {
      return (
        <p className="chips">
          {categories.map((category) => (
            <span className="chip">{category}</span>
          ))}
        </p>
      )
    }
    ```
- **Exact Fix**:
  - Provide the unique category string as `key={category}` on the mapped `<span>`:
    ```tsx
    export function CategoryChips({ categories }: { categories: string[] }) {
      return (
        <p className="chips">
          {categories.map((category) => (
            <span key={category} className="chip">
              {category}
            </span>
          ))}
        </p>
      )
    }
    ```

---

### Bug 2 — Numeric `0` Short-Circuit (`&&`) Rendering Stray `"0"` in `StockNote` and `CartPanel`

- **Location**:
  - `src/components/StockNote.tsx` (line 6)
  - `src/components/CartPanel.tsx` (line 20)
- **Symptom**:
  - Out-of-stock products (`Mini Crossbody Bag` with `stock: 0` and `Wool Scarf` with `stock: 0`) render a visible `"0"` inside `<p className="stock">0</p>` instead of rendering an empty stock note.
  - When the cart is empty (`cart.length === 0`), `<aside className="cart">` renders a stray `"0"` between the `<h2>Cart</h2>` heading and `<p className="total">Total: $0</p>` (`"Cart0Total: $0"`).
- **Root Cause**:
  - Both components use numeric left-hand operands with JavaScript's logical `&&` operator in JSX:
    ```tsx
    // src/components/StockNote.tsx
    return <p className="stock">{stock && <span>Only {stock} left</span>}</p>;

    // src/components/CartPanel.tsx
    {cart.length && (
      <ul>
        {cart.map((item) => ...)}
      </ul>
    )}
    ```
  - When `stock` or `cart.length` is `0`, `0 && expression` short-circuits and evaluates to the number `0`. React renders numeric `0` as a literal text node `"0"` in the DOM.
- **Exact Fix**:
  - Use an explicit boolean comparison (`> 0`) with a ternary returning `null`:
    ```tsx
    // src/components/StockNote.tsx
    export function StockNote({ stock }: { stock: number }) {
      return (
        <p className="stock">
          {stock > 0 ? <span>Only {stock} left</span> : null}
        </p>
      )
    }

    // src/components/CartPanel.tsx
    {
      cart.length > 0 ? (
        <ul>
          {cart.map((item) => {
            const product = products.find((p) => p.id === item.id)
            return product ? (
              <CartRow
                key={item.id}
                item={item}
                product={product}
                onChange={onChange}
              />
            ) : null
          })}
        </ul>
      ) : null
    }
    ```

---

### Bug 3 — In-Place Array Mutation (`products.sort(...)`) Breaking Return to `"Featured"` Order

- **Location**: `src/components/ProductList.tsx` (line 14)
- **Symptom**:
  - Selecting `"Price: low to high"` (`sort = "price-asc"`) reorders the grid to `["Wool Scarf", "Mini Crossbody Bag", "Canvas Backpack", "White Sneakers", "Leather Tote Bag", "Running Shoes"]`.
  - Switching the `<select>` back to `"Featured"` (`sort = "featured"`) does **not** restore the original featured order (`["Leather Tote Bag", "Canvas Backpack", ...]`); the grid remains permanently stuck in ascending price order.
- **Root Cause**:
  - `ProductList` calls `products.sort((a, b) => a.price - b.price)` directly on the `products` prop reference (`PRODUCTS`):
    ```tsx
    const shown =
      sort === 'price-asc'
        ? products.sort((a, b) => a.price - b.price)
        : products
    ```
  - Because `Array.prototype.sort()` mutates the array in place, the shared `PRODUCTS` array is permanently reordered on the first `"price-asc"` render. Subsequent renders with `sort === "featured"` return the already-mutated `PRODUCTS` array.
- **Exact Fix**:
  - Clone the array before sorting (using `[...products].sort(...)` or `products.toSorted(...)`) so the input prop array is never mutated:
    ```tsx
    const shown =
      sort === 'price-asc'
        ? [...products].sort((a, b) => a.price - b.price)
        : products
    ```

---

### Bug 4 — Array `index` Used as `key` on Stateful `ProductCard` Components

- **Location**: `src/components/ProductList.tsx` (line 18) & `src/components/ProductCard.tsx` (line 10)
- **Symptom**:
  - Clicking the heart button (`aria-label="Save Leather Tote Bag"`) on the first product card (`Leather Tote Bag`, index `0`) toggles its local `saved` state to `true` (`"♥"`).
  - When `Sort` is changed to `"Price: low to high"`, `Wool Scarf` ($25) moves into index `0` and inherits `"♥"` (`saved = true`), while `Leather Tote Bag` ($89, now at index `4`) reverts to `"♡"` (`saved = false`).
- **Root Cause**:
  - `ProductList` keys each `ProductCard` by its array position `index` rather than the stable product ID:
    ```tsx
    {
      shown.map((product, index) => (
        <ProductCard key={index} product={product} onAdd={onAdd} />
      ))
    }
    ```
  - Because `ProductCard` holds local component state (`const [saved, setSaved] = useState(false)`), React reconciles Fibers by `key={index}` and keeps `saved = true` attached to slot `0` regardless of which `product` prop is passed to that slot.
- **Exact Fix**:
  - Key `ProductCard` by `product.id`:
    ```tsx
    {
      shown.map((product) => (
        <ProductCard key={product.id} product={product} onAdd={onAdd} />
      ))
    }
    ```

---

### Bug 5 — Direct State Mutation (`item.qty = item.qty + 1`) & Same-Reference `setCart(cart)` Bailout

- **Location**:
  - `src/components/CartRow.tsx` (lines 8–10)
  - `src/App.tsx` (line 35)
- **Symptom**:
  - After adding an in-stock item (e.g., `Canvas Backpack`, $49) to the cart, the cart displays `Canvas Backpack × 1`, `Cart (1)`, and `Total: $49`.
  - Clicking the `+` button (`aria-label="Add one more Canvas Backpack"`) inside `CartRow` does **not** update the UI (`× 1`, `Cart (1)`, and `Total: $49` remain frozen), even though inspecting the Fiber state in React DevTools shows `item.qty` was mutated in memory to `2`.
- **Root Cause**:
  - `CartRow` mutates the `item` prop object directly in place and calls `onChange()` with no arguments:
    ```tsx
    // src/components/CartRow.tsx
    function increase() {
      item.qty = item.qty + 1
      onChange()
    }
    ```
  - `App` passes `onChange={() => setCart(cart)}`, passing the **exact same `cart` array reference** back to `setCart`:
    ```tsx
    // src/App.tsx
    <CartPanel cart={cart} products={PRODUCTS} onChange={() => setCart(cart)} />
    ```
  - Because `Object.is(prevCart, cart)` evaluates to `true`, React bails out of scheduling a re-render.
- **Exact Fix**:
  - Pass `item.id` (or reuse `add(id)`) and return a new array and new item object immutably in `setCart`:
    ```tsx
    // src/components/CartRow.tsx
    function increase() {
      onChange(item.id)
    }

    // src/App.tsx
    ;<CartPanel
      cart={cart}
      products={PRODUCTS}
      onChange={(id) =>
        setCart((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, qty: item.qty + 1 } : item,
          ),
        )
      }
    />
    ```

---

## 3. Summary Table

| #   | Component / File                                                    | Bug Category                                           | Symptom                                                                                       | Fix                                                                   |
| :-- | :------------------------------------------------------------------ | :----------------------------------------------------- | :-------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------- |
| 1   | `src/components/CategoryChips.tsx:9`                                | Missing list `key`                                     | Console error: `Each child in a list should have a unique "key" prop`                         | Add `key={category}` to `<span className="chip">`                     |
| 2   | `src/components/StockNote.tsx:6`, `src/components/CartPanel.tsx:20` | Numeric `0 && ...` in JSX                              | Renders literal `"0"` on out-of-stock cards and empty cart panel                              | Replace `stock && ...` / `cart.length && ...` with `> 0 ? ... : null` |
| 3   | `src/components/ProductList.tsx:14`                                 | In-place prop array mutation                           | `products.sort(...)` mutates `PRODUCTS`; returning to `"Featured"` sort stays sorted by price | Clone before sorting: `[...products].sort(...)`                       |
| 4   | `src/components/ProductList.tsx:18`                                 | Array `index` as `key`                                 | `ProductCard` `saved` (`"♥"`) state stays attached to card index `0` when sorting changes     | Use stable `key={product.id}` on `<ProductCard />`                    |
| 5   | `src/components/CartRow.tsx:8`, `src/App.tsx:35`                    | Direct state mutation + same-reference `setCart(cart)` | Clicking `+` in `CartRow` mutates `item.qty` in place without re-rendering count or total     | Update cart immutably via `setCart(prev => prev.map(...))`            |
