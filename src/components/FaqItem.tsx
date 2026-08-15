/** Раскрытый вопрос помечен индиговым рельсом, а не только повёрнутым плюсом:
 *  в столбце из шести строк видно, какая открыта, даже боковым зрением. */
export function FaqItem({ q, a, open, onToggle, delay = 0 }: { q: string; a: string; open: boolean; onToggle: () => void; delay?: number }) {
  return (
    <div
      className={`glass rounded-2xl relative overflow-hidden px-4 sm:px-5 transition-[background-color] duration-300 group animate-fade-in ${open ? 'bg-white/[0.05]' : 'hover:bg-white/[0.06]'}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span
        aria-hidden
        className={`absolute left-0 inset-y-2 w-[2px] rounded-full bg-brand origin-center transition-transform duration-500 ease-out ${open ? 'scale-y-100' : 'scale-y-0'}`}
      />
      <button
        onClick={onToggle}
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-4 py-4 sm:py-5 text-left text-base sm:text-lg font-medium transition-colors ${open ? 'text-white' : 'text-white/80 hover:text-white'}`}
      >
        {q}
        <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-300 ${open ? 'bg-brand/20 text-white/80' : 'bg-white/[0.05] text-white/30 group-hover:text-white/60'}`}>
          <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${open ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-60 pb-4 sm:pb-5' : 'max-h-0'}`}>
        <p className="text-white/50 text-sm sm:text-base leading-relaxed border-t border-white/[0.06] pt-3.5">{a}</p>
      </div>
    </div>
  )
}
