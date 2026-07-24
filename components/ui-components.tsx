'use client'

export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`bg-card border border-border rounded-lg p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  )
}

export function KPICard({
  title,
  value,
  trend,
  trendValue,
}: {
  title: string
  value: string | number
  trend?: 'up' | 'down'
  trendValue?: string
}) {
  return (
    <Card className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-card-foreground mt-2">{value}</p>
          {trend && trendValue && (
            <p
              className={`text-xs font-medium mt-2 ${
                trend === 'up' ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}

export function Chip({
  label,
  variant = 'default',
}: {
  label: string
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
}) {
  const variants = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-green-500/20 text-green-700 dark:text-green-400',
    warning: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
    error: 'bg-red-500/20 text-red-700 dark:text-red-400',
    info: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
  }

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${variants[variant]}`}
    >
      {label}
    </span>
  )
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
}: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  const variants = {
    primary:
      'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50',
    secondary:
      'bg-secondary text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50',
    outline:
      'border border-border bg-transparent text-foreground hover:bg-muted disabled:opacity-50',
    ghost: 'text-foreground hover:bg-muted disabled:opacity-50',
  }

  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-sm font-medium',
    lg: 'px-6 py-3 text-base font-medium',
  }

  return (
    <button
      className={`rounded-lg transition-colors font-medium ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-border'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
