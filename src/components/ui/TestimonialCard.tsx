import type { Testimonial } from '../../data/homepageData'

interface TestimonialCardProps {
  testimonial: Testimonial
  featured?: boolean
}

export function TestimonialCard({ testimonial, featured = false }: TestimonialCardProps) {
  return (
    <figure className={`card p-6 md:p-8 h-full flex flex-col ${featured ? 'border-forest-200 bg-forest-50/30' : ''}`}>
      <div className="flex items-center gap-3 mb-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-white">
          {testimonial.initials}
        </span>
        <figcaption>
          <p className="text-sm font-bold text-ink">{testimonial.name}</p>
          <p className="text-xs text-ink-3">{testimonial.role}, {testimonial.company}</p>
        </figcaption>
      </div>
      {testimonial.outcome && (
        <span className="mb-4 inline-flex w-fit rounded px-2 py-0.5 text-[11px] font-semibold bg-gold-100 text-gold-700">
          {testimonial.outcome}
        </span>
      )}
      <blockquote className={`flex-1 text-ink-2 leading-relaxed ${featured ? 'text-[15px]' : 'text-sm'}`}>
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>
      <div className="mt-5 flex gap-0.5" aria-label="5 star rating">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} className="h-3.5 w-3.5 text-gold-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    </figure>
  )
}
