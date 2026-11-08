import * as React from 'react'
import { cn } from '../../lib/utils.ts'
import { Label } from './label.tsx'

/**
 * Official shadcn/ui Field component primitives (v4 specification)
 * Reference: https://ui.shadcn.com/docs/components/field
 * Reference: https://ui.shadcn.com/docs/forms/react-hook-form
 */

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal'
  'data-invalid'?: boolean
}

export function Field({
  className,
  orientation = 'vertical',
  'data-invalid': dataInvalid,
  ...props
}: FieldProps) {
  return (
    <div
      data-slot="field"
      data-orientation={orientation}
      data-invalid={dataInvalid}
      className={cn(
        'group/field flex gap-2',
        orientation === 'vertical' ? 'flex-col' : 'flex-row items-center',
        className,
      )}
      {...props}
    />
  )
}

export interface FieldLabelProps extends React.ComponentPropsWithoutRef<
  typeof Label
> {}

export function FieldLabel({ className, ...props }: FieldLabelProps) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        'flex w-fit items-center gap-2 select-none group-data-[disabled=true]/field:pointer-events-none group-data-[disabled=true]/field:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export interface FieldDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function FieldDescription({
  className,
  ...props
}: FieldDescriptionProps) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        'text-muted-foreground text-sm leading-normal group-has-[[data-slot=field-error]]/field:hidden',
        className,
      )}
      {...props}
    />
  )
}

export interface FieldErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  errors?: Array<{ message?: string } | undefined>
}

export function FieldError({
  className,
  children,
  errors,
  ...props
}: FieldErrorProps) {
  const content = React.useMemo(() => {
    if (children) {
      return children
    }

    if (!errors?.length) {
      return null
    }

    // Deduplicate error messages by message content
    const uniqueErrors = [
      ...new Map(
        errors
          .filter((err): err is { message?: string } => Boolean(err?.message))
          .map((error) => [error.message, error]),
      ).values(),
    ]

    if (uniqueErrors.length === 1) {
      return uniqueErrors[0]?.message
    }

    return (
      <ul className="flex flex-col gap-1 list-disc pl-4">
        {uniqueErrors.map((error, index) => (
          <li key={index}>{error.message}</li>
        ))}
      </ul>
    )
  }, [children, errors])

  if (!content) {
    return null
  }

  return (
    <div
      data-slot="field-error"
      role="alert"
      className={cn('text-destructive text-sm font-normal', className)}
      {...props}
    >
      {content}
    </div>
  )
}

export function FieldGroup({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="field-group"
      className={cn('flex flex-col gap-4', className)}
      {...props}
    />
  )
}

export function FieldSet({
  className,
  ...props
}: React.HTMLAttributes<HTMLFieldSetElement>) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn('flex flex-col gap-4', className)}
      {...props}
    />
  )
}

export function FieldLegend({
  className,
  ...props
}: React.HTMLAttributes<HTMLLegendElement>) {
  return (
    <legend
      data-slot="field-legend"
      className={cn('text-base font-semibold', className)}
      {...props}
    />
  )
}
