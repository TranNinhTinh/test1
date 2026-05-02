import type { InputHTMLAttributes } from 'react'

export interface AppFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function AppField({ label, error, className = '', id, ...rest }: AppFieldProps) {
  const inputId = id || rest.name
  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium tracking-tight text-foreground">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={[
          'w-full rounded-app-lg border border-outline-variant/80 bg-surface px-app-sm py-3 text-foreground shadow-inner-soft placeholder:text-foreground-muted/75',
          'transition-[border-color,box-shadow] duration-app-fast ease-app-emphasized',
          'hover:border-outline-variant focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/18 focus:shadow-sm',
          error ? 'border-app-error focus:border-app-error focus:ring-red-600/20' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      />
      {error ? <p className="mt-1 text-sm text-app-error" role="alert">{error}</p> : null}
    </div>
  )
}
