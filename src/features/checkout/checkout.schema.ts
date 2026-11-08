import { z } from 'zod'

/**
 * ShopBoard — Single Authoritative Checkout Validation Schema (Day 5 Phase 4)
 *
 * Centralizes all validation rules, constraints, and error messages
 * in a single declarative Zod schema.
 *
 * Distinct responsibilities:
 * - React Hook Form: Manages field and form lifecycle, input registration, dirty state, submission, and DOM focus.
 * - Zod: Validates raw field values against schema constraints and generates localized error messages.
 * - shadcn/ui: Presents accessible form controls with proper ARIA attributes, semantic labels, and focus rings.
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
      // Standard RFC-compliant email regex
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
      if (!/^\d{5}(-\d{4})?$/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Postal code must be a valid 5-digit US ZIP code (e.g. 12345 or 12345-6789)',
        })
      }
    }),
})

/**
 * TypeScript form data type inferred directly from the single Zod schema.
 * Prevents drift between runtime validation and static types.
 */
export type CheckoutFormData = z.infer<typeof checkoutSchema>
