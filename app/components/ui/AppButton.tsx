import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'filled' | 'outlined' | 'tonal'

export interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

export default function AppButton({
  variant = 'filled',
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}: AppButtonProps) {
  const base =
    'inline-flex min-h-[52px] items-center justify-center rounded-app-lg px-app-md py-app-sm text-base font-semibold tracking-tight transition-[background-color,color,box-shadow,transform,opacity] duration-app-medium ease-app-emphasized focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99]'

  const variants: Record<Variant, string> = {
    filled:
      'bg-brand text-white shadow-md shadow-brand/20 hover:bg-brand-dark hover:shadow-lg hover:shadow-brand/25',
    outlined:
      'border border-outline-variant/80 bg-surface text-brand shadow-sm hover:border-brand/30 hover:bg-brand-tint/50 hover:shadow-md',
    tonal: 'bg-brand-tint text-brand-dark shadow-sm hover:bg-brand/10 hover:shadow-md',
  }

  return (
    <button type={type} className={`${base} ${variants[variant]} ${className}`} disabled={disabled} {...rest}>
      {children}
    </button>
  )
}
