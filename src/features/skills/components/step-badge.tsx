interface StepBadgeProps {
  step: 1 | 2 | 3
  title: string
}

export function StepBadge({ step, title }: StepBadgeProps) {
  return (
    <div className="mb-1 flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        {step}
      </span>
      <h2 className="text-sm font-semibold">{title}</h2>
    </div>
  )
}
