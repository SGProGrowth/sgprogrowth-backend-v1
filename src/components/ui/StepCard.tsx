import type { Step } from '../../data/homepageData'

interface StepCardProps {
  step: Step
  isLast?: boolean
}

export function StepCard({ step, isLast = false }: StepCardProps) {
  return (
    <div className="relative flex gap-4 md:flex-col md:items-start md:gap-0 md:text-left">
      {!isLast && (
        <div
          className="absolute left-[1.125rem] top-12 hidden h-[calc(100%-3rem)] w-px bg-slate-200 md:left-6 md:top-14 md:block md:h-px md:w-[calc(100%-3rem)] md:translate-x-12"
          aria-hidden="true"
        />
      )}
      <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-brand-600 bg-white text-xs font-bold text-brand-600 md:h-12 md:w-12 md:text-sm">
        {step.number}
      </div>
      <div className="pb-8 md:pb-0 md:pt-5">
        <h3 className="text-base font-semibold text-navy-900">{step.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{step.description}</p>
      </div>
    </div>
  )
}
