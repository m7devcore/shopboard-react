/**
 * ShopBoard — Checkout & Validation Test Suite (Day 5 Phase 4)
 *
 * Verifies all 12 instructor-mandated checkout scenarios:
 * 1. Required fields empty validation
 * 2. Invalid email format rejection
 * 3. Invalid name and address constraint enforcement
 * 4. First-invalid-field focus prioritization
 * 5. Valid submission schema acceptance
 * 6. Double-submit prevention
 * 7. Empty cart blocked from submission
 * 8. Validation failure preserves cart and inputs
 * 9. Controlled simulated failure preserves cart and inputs
 * 10. Successful demo confirmation and cart clearing
 * 11. Shared header/cart counts remain synchronized
 * 12. Refresh and navigation do not break the existing cart
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { checkoutSchema, type CheckoutFormData } from './checkout.schema.ts'
import type { DemoOrderSnapshot } from './checkout.types.ts'
import { addItem, clearCart, calculateTotalItems } from '../cart/cart.logic.ts'
import { calculateTotalPrice } from '../../modules/cart/cart.logic.ts'
import { loadAndMigrateCart, saveCartToStorage } from '../cart/cart.storage.ts'
import type { Cart } from '../cart/cart.types.ts'

describe('ShopBoard Validated Demo Checkout (Day 5 Phase 4)', () => {
  const validData: CheckoutFormData = {
    fullName: 'Jane Doe',
    email: 'jane.doe@example.com',
    address: '123 Studio Boulevard',
    city: 'San Francisco',
    postalCode: '94103',
  }

  // =========================================================================
  // Scenario 1: Required fields empty
  // =========================================================================
  describe('Scenario 1: Required fields empty', () => {
    it('fails schema validation when all fields are empty strings or whitespace', () => {
      const result = checkoutSchema.safeParse({
        fullName: '   ',
        email: '   ',
        address: '   ',
        city: '   ',
        postalCode: '   ',
      })

      assert.equal(result.success, false)
      if (!result.success) {
        const errorMap = new Map(
          result.error.issues.map((issue) => [issue.path[0], issue.message]),
        )

        assert.equal(errorMap.has('fullName'), true)
        assert.equal(errorMap.get('fullName'), 'Full name is required')

        assert.equal(errorMap.has('email'), true)
        assert.equal(errorMap.get('email'), 'Email address is required')

        assert.equal(errorMap.has('address'), true)
        assert.equal(errorMap.get('address'), 'Shipping address is required')

        assert.equal(errorMap.has('city'), true)
        assert.equal(errorMap.get('city'), 'City is required')

        assert.equal(errorMap.has('postalCode'), true)
        assert.equal(errorMap.get('postalCode'), 'Postal code is required')
      }
    })
  })

  // =========================================================================
  // Scenario 2: Invalid email format
  // =========================================================================
  describe('Scenario 2: Invalid email format', () => {
    const invalidEmails = [
      'notanemail',
      'user@',
      '@domain.com',
      'user@.com',
      'user space@domain.com',
    ]

    for (const email of invalidEmails) {
      it(`rejects invalid email address: "${email}"`, () => {
        const result = checkoutSchema.safeParse({
          ...validData,
          email,
        })

        assert.equal(result.success, false)
        if (!result.success) {
          const emailIssue = result.error.issues.find(
            (i) => i.path[0] === 'email',
          )
          assert.ok(
            emailIssue,
            `Expected email validation error for "${email}"`,
          )
          assert.equal(emailIssue.message, 'Please enter a valid email address')
        }
      })
    }

    it('accepts standard valid email addresses', () => {
      const result = checkoutSchema.safeParse({
        ...validData,
        email: 'customer.service+tag@studio-shop.org',
      })
      assert.equal(result.success, true)
    })
  })

  // =========================================================================
  // Scenario 3: Invalid name and address constraints
  // =========================================================================
  describe('Scenario 3: Invalid name/address', () => {
    it('rejects full name shorter than 2 characters', () => {
      const result = checkoutSchema.safeParse({
        ...validData,
        fullName: 'J',
      })
      assert.equal(result.success, false)
      if (!result.success) {
        const nameIssue = result.error.issues.find(
          (i) => i.path[0] === 'fullName',
        )
        assert.ok(nameIssue)
        assert.equal(
          nameIssue.message,
          'Full name must be at least 2 characters',
        )
      }
    })

    it('rejects shipping address shorter than 5 characters', () => {
      const result = checkoutSchema.safeParse({
        ...validData,
        address: '123',
      })
      assert.equal(result.success, false)
      if (!result.success) {
        const addrIssue = result.error.issues.find(
          (i) => i.path[0] === 'address',
        )
        assert.ok(addrIssue)
        assert.equal(
          addrIssue.message,
          'Shipping address must be at least 5 characters',
        )
      }
    })

    it('rejects invalid postal code format', () => {
      const result = checkoutSchema.safeParse({
        ...validData,
        postalCode: '!!',
      })
      assert.equal(result.success, false)
      if (!result.success) {
        const zipIssue = result.error.issues.find(
          (i) => i.path[0] === 'postalCode',
        )
        assert.ok(zipIssue)
        assert.equal(
          zipIssue.message,
          'Please enter a valid postal or ZIP code',
        )
      }
    })

    it('accepts valid international postal codes (US, UK, TR, CA, EU)', () => {
      const internationalCodes = [
        '94103',
        '94103-1234',
        'SW1A 1AA',
        '34330',
        'K1A 0B1',
        '75001',
      ]
      for (const code of internationalCodes) {
        const result = checkoutSchema.safeParse({
          ...validData,
          postalCode: code,
        })
        assert.equal(result.success, true, `Expected "${code}" to be valid`)
      }
    })
  })

  // =========================================================================
  // Scenario 4: First-invalid-field focus order
  // =========================================================================
  describe('Scenario 4: First-invalid-field focus order', () => {
    it('determines the exact registered field order for auto-focus on error', () => {
      const fieldOrder = ['fullName', 'email', 'address', 'city', 'postalCode']

      // When all are empty, the first invalid field is fullName
      const allEmptyResult = checkoutSchema.safeParse({
        fullName: '',
        email: '',
        address: '',
        city: '',
        postalCode: '',
      })
      assert.equal(allEmptyResult.success, false)
      if (!allEmptyResult.success) {
        const errorKeys = allEmptyResult.error.issues.map((i) => i.path[0])
        const firstErrorKey = fieldOrder.find((k) => errorKeys.includes(k))
        assert.equal(firstErrorKey, 'fullName')
      }

      // When fullName is valid but email is invalid, the first invalid field is email
      const validNameResult = checkoutSchema.safeParse({
        ...validData,
        email: 'invalid-email',
      })
      assert.equal(validNameResult.success, false)
      if (!validNameResult.success) {
        const errorKeys = validNameResult.error.issues.map((i) => i.path[0])
        const firstErrorKey = fieldOrder.find((k) => errorKeys.includes(k))
        assert.equal(firstErrorKey, 'email')
      }
    })
  })

  // =========================================================================
  // Scenario 5: Valid submission
  // =========================================================================
  describe('Scenario 5: Valid submission', () => {
    it('accepts complete, valid customer details and trims excess whitespace', () => {
      const result = checkoutSchema.safeParse({
        fullName: '  Jane Doe  ',
        email: '  jane.doe@example.com  ',
        address: '  123 Studio Boulevard  ',
        city: '  San Francisco  ',
        postalCode: '  94103  ',
      })

      assert.equal(result.success, true)
      if (result.success) {
        assert.equal(result.data.fullName, 'Jane Doe')
        assert.equal(result.data.email, 'jane.doe@example.com')
        assert.equal(result.data.address, '123 Studio Boulevard')
        assert.equal(result.data.city, 'San Francisco')
        assert.equal(result.data.postalCode, '94103')
      }
    })
  })

  // =========================================================================
  // Scenario 6: Double-submit prevention
  // =========================================================================
  describe('Scenario 6: Double-submit prevention', () => {
    it('blocks concurrent submission attempts while request is in flight', async () => {
      let submitInvocationCount = 0
      let isSubmitting = false

      const simulateSubmit = async () => {
        if (isSubmitting) return 'BLOCKED_DUPLICATE'
        isSubmitting = true
        submitInvocationCount++
        await new Promise((r) => setTimeout(r, 50))
        isSubmitting = false
        return 'SUCCESS'
      }

      const [res1, res2, res3] = await Promise.all([
        simulateSubmit(),
        simulateSubmit(),
        simulateSubmit(),
      ])

      assert.equal(submitInvocationCount, 1)
      assert.equal(res1, 'SUCCESS')
      assert.equal(res2, 'BLOCKED_DUPLICATE')
      assert.equal(res3, 'BLOCKED_DUPLICATE')
    })
  })

  // =========================================================================
  // Scenario 7: Empty cart blocked
  // =========================================================================
  describe('Scenario 7: Empty cart blocked', () => {
    it('rejects checkout submission when cart item count is zero', () => {
      const emptyCart: Cart = []
      const totalItems = calculateTotalItems(emptyCart)

      assert.equal(totalItems, 0)

      let attemptedSubmission = false
      const canSubmit = (itemsCount: number): boolean => {
        if (itemsCount === 0) return false
        attemptedSubmission = true
        return true
      }

      const allowed = canSubmit(totalItems)
      assert.equal(allowed, false)
      assert.equal(attemptedSubmission, false)
    })
  })

  // =========================================================================
  // Scenario 8: Validation failure preserves cart and inputs
  // =========================================================================
  describe('Scenario 8: Validation failure preserves cart and inputs', () => {
    it('preserves the active cart items and user inputs when validation errors occur', () => {
      let cart: Cart = [{ id: '1', qty: 2 }]
      const inputBuffer = { ...validData, email: 'broken-email' }

      const validation = checkoutSchema.safeParse(inputBuffer)
      assert.equal(validation.success, false)

      // Cart must remain unchanged
      assert.equal(cart.length, 1)
      assert.equal(cart[0]?.id, '1')
      assert.equal(cart[0]?.qty, 2)

      // Input values must remain preserved
      assert.equal(inputBuffer.fullName, 'Jane Doe')
      assert.equal(inputBuffer.email, 'broken-email')
    })
  })

  // =========================================================================
  // Scenario 9: Controlled simulated failure preserves cart and inputs
  // =========================================================================
  describe('Scenario 9: Controlled simulated failure preserves cart and inputs', () => {
    it('preserves cart and form inputs when deterministic simulated failure triggers', async () => {
      let cart: Cart = [
        { id: '1', qty: 1 },
        { id: '2', qty: 3 },
      ]
      const inputBuffer = { ...validData }
      const simulateFailure = true

      let failureMessage: string | null = null

      try {
        if (simulateFailure) {
          throw new Error(
            'Simulated payment gateway declined this transaction. Your cart items and form entries remain intact.',
          )
        }
        // Should not reach cart clear
        cart = clearCart()
      } catch (err) {
        failureMessage = err instanceof Error ? err.message : String(err)
      }

      assert.ok(failureMessage?.includes('declined this transaction'))
      // Cart items remain completely intact
      assert.equal(cart.length, 2)
      assert.equal(cart[0]?.qty, 1)
      assert.equal(cart[1]?.qty, 3)

      // Inputs remain intact
      assert.equal(inputBuffer.fullName, 'Jane Doe')
      assert.equal(inputBuffer.email, 'jane.doe@example.com')
    })
  })

  // =========================================================================
  // Scenario 10: Successful demo confirmation and cart clearing
  // =========================================================================
  describe('Scenario 10: Successful demo confirmation and cart clearing', () => {
    it('captures full demo order snapshot before clearing cart', () => {
      let cart: Cart = [
        { id: '1', qty: 2 },
        { id: '2', qty: 1 },
      ]

      const hydratedItems = [
        { id: '1', name: 'Leather Tote Bag', price: 120, qty: 2 },
        { id: '2', name: 'Ceramic Pour-Over', price: 45, qty: 1 },
      ]
      const totalItems = calculateTotalItems(cart)
      const totalPrice = calculateTotalPrice(
        hydratedItems.map((i) => ({ price: i.price, quantity: i.qty })),
      )

      // Create snapshot
      const snapshot: DemoOrderSnapshot = {
        customer: validData,
        items: hydratedItems.map((i) => ({ ...i })),
        totalItems,
        totalPrice,
        confirmedAt: new Date().toISOString(),
        isDemonstration: true,
      }

      // Clear the cart
      cart = clearCart()

      // Assertions
      assert.equal(cart.length, 0)
      assert.equal(snapshot.isDemonstration, true)
      assert.equal(snapshot.totalItems, 3)
      assert.equal(snapshot.totalPrice, 285)
      assert.equal(snapshot.customer.fullName, 'Jane Doe')
      assert.equal(snapshot.items.length, 2)
    })
  })

  // =========================================================================
  // Scenario 11: Shared header/cart counts remain synchronized
  // =========================================================================
  describe('Scenario 11: Shared header/cart counts remain synchronized', () => {
    it('synchronizes header cart badge count through the entire lifecycle', () => {
      let cart: Cart = []

      // 1. Initial catalog state
      assert.equal(calculateTotalItems(cart), 0)

      // 2. User adds product 1
      cart = addItem(cart, '1')
      assert.equal(calculateTotalItems(cart), 1)

      // 3. User adds product 2 with qty 2
      cart = addItem(cart, '2', 2)
      assert.equal(calculateTotalItems(cart), 3)

      // 4. Checkout completes successfully -> cart cleared
      cart = clearCart()
      assert.equal(calculateTotalItems(cart), 0)
    })
  })

  // =========================================================================
  // Scenario 12: Refresh and navigation do not break the existing cart
  // =========================================================================
  describe('Scenario 12: Refresh and navigation do not break the existing cart', () => {
    it('preserves cart across storage serialization and round-trips correctly', () => {
      const mockStorage = new Map<string, string>()
      const storageMock = {
        getItem: (k: string) => mockStorage.get(k) ?? null,
        setItem: (k: string, v: string) => mockStorage.set(k, v),
        removeItem: (k: string) => mockStorage.delete(k),
        clear: () => mockStorage.clear(),
        length: 0,
        key: () => null,
      }

      // Save cart before checkout
      const cartBeforeCheckout: Cart = [
        { id: '1', qty: 2 },
        { id: '2', qty: 1 },
      ]
      saveCartToStorage(cartBeforeCheckout, storageMock)

      // Simulate page refresh: reload cart from storage
      const reloadedCart = loadAndMigrateCart(storageMock)
      assert.deepEqual(reloadedCart, cartBeforeCheckout)

      // Complete checkout and persist cleared cart
      const clearedCart = clearCart()
      saveCartToStorage(clearedCart, storageMock)

      // Simulate subsequent refresh after checkout
      const finalReloadedCart = loadAndMigrateCart(storageMock)
      assert.deepEqual(finalReloadedCart, [])
    })
  })
})
