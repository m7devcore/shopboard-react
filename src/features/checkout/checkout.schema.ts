import { z } from 'zod'

/**
 * ShopBoard — Single Authoritative Checkout Validation Schema (Day 5 Phase 4/5)
 *
 * Centralizes all validation rules, constraints, and error messages
 * in a single declarative Zod schema.
 *
 * Responsibilities:
 * - React Hook Form Controller: Manages input values, dirty state, submission, and DOM focus.
 * - Zod: Validates field constraints against schema rules with internationalized error messages.
 * - shadcn/ui Field: Renders accessible, styled field primitives (Field, FieldLabel, FieldError).
 */
export const checkoutSchema = z.object({
  fullName: z
    .string()
    .trim()
    .superRefine((val, ctx) => {
      if (val.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Full name is required',
        })
        return
      }
      if (val.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Full name must be at least 2 characters',
        })
      }
      if (val.length > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Full name must not exceed 100 characters',
        })
      }
    }),

  email: z
    .string()
    .trim()
    .superRefine((val, ctx) => {
      if (val.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Email address is required',
        })
        return
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please enter a valid email address',
        })
      }
    }),

  address: z
    .string()
    .trim()
    .superRefine((val, ctx) => {
      if (val.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Shipping address is required',
        })
        return
      }
      if (val.length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Shipping address must be at least 5 characters',
        })
      }
      if (val.length > 200) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Shipping address must not exceed 200 characters',
        })
      }
    }),

  city: z
    .string()
    .trim()
    .superRefine((val, ctx) => {
      if (val.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'City is required',
        })
        return
      }
      if (val.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'City must be at least 2 characters',
        })
      }
      if (val.length > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'City must not exceed 100 characters',
        })
      }
    }),

  postalCode: z
    .string()
    .trim()
    .superRefine((val, ctx) => {
      if (val.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Postal code is required',
        })
        return
      }
      // Standard postal code format supporting international formats (3-10 chars: letters, numbers, spaces, hyphens)
      if (val.length < 3 || val.length > 10 || !/^[A-Za-z0-9\s-]+$/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please enter a valid postal or ZIP code',
        })
      }
    }),
})

/**
 * TypeScript form data type inferred directly from the single Zod schema.
 */
export type CheckoutFormData = z.infer<typeof checkoutSchema>
