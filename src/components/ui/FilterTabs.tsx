interface FilterTabsProps {
  tabs: string[]
  activeTab: string
  onChange: (tab: string) => void
}

export function FilterTabs({ tabs, activeTab, onChange }: FilterTabsProps) {
  return (
    <div role="tablist" aria-label="Course filters" className="flex gap-1 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={tab === activeTab}
          onClick={() => onChange(tab)}
          className={`shrink-0 rounded-md px-3.5 py-2 text-sm font-medium transition-colors ${
            tab === activeTab
              ? 'bg-ink text-white'
              : 'text-ink-3 hover:text-ink hover:bg-stone-100'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
