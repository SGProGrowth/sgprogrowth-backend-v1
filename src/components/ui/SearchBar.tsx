import { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchSuggestions } from '../../data/homepageData'

interface SearchBarProps {
  placeholder?: string
  suggestions?: string[]
  size?: 'md' | 'lg'
  className?: string
  defaultQuery?: string
}

export function SearchBar({
  placeholder = 'Search courses, certifications, or skills',
  suggestions = searchSuggestions,
  size = 'md',
  className = '',
  defaultQuery = '',
}: SearchBarProps) {
  const navigate = useNavigate()
  const inputId = useId()
  const [query, setQuery] = useState(defaultQuery)
  const [focused, setFocused] = useState(false)

  const h = size === 'lg' ? 'h-[52px] text-[15px]' : 'h-10 text-sm'

  const goToSearch = (term: string) => {
    const trimmed = term.trim()
    if (!trimmed) return
    navigate(`/courses?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className={`relative ${className}`}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          goToSearch(query)
        }}
        className={`flex items-center overflow-hidden rounded-md border border-stone-300 bg-white transition-colors focus-within:border-forest-600 focus-within:ring-2 focus-within:ring-forest-100 ${h}`}
      >
        <label htmlFor={inputId} className="sr-only">Search courses</label>
        <svg className="ml-4 h-4 w-4 shrink-0 text-ink-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-3 text-ink placeholder:text-ink-4 focus:outline-none"
        />
        <button type="submit" className="hidden sm:block shrink-0 h-full px-5 bg-forest-800 text-sm font-semibold text-white hover:bg-forest-900 transition-colors">
          Search
        </button>
      </form>

      {focused && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-stone-200 bg-white py-1 shadow-[0_8px_30px_rgba(10,10,10,0.1)]">
          <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-ink-4">Popular</p>
          {suggestions.map((term) => (
            <button
              key={term}
              type="button"
              onMouseDown={() => goToSearch(term)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-ink-2 hover:bg-stone-50 hover:text-ink transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
