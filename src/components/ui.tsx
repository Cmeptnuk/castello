export function SlideFade({ active, delay = 0, children, className }: { active: boolean; delay?: number; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`slide-content ${active ? 'is-active' : ''} ${className || ''}`}
      style={{ transitionDelay: active ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}

/** Надзаголовок необязателен: на слайде оплаты он повторял бы название
 *  раздела в навигации, а рядом с «Доступные способы» это просто шум. */
export function SectionHeading({ label, title, align = 'center' }: { label?: string; title: string; align?: 'center' | 'left' }) {
  const left = align === 'left'
  return (
    <div className={left ? 'text-left' : 'text-center'}>
      {label && <span className="inline-block text-[10px] tracking-[0.25em] uppercase text-white/30 bg-white/[0.04] px-4 py-1.5 rounded-full mb-2 sm:mb-4">{label}</span>}
      <h2 className={`font-bold ${left ? 'text-2xl sm:text-3xl lg:text-4xl' : 'text-3xl sm:text-4xl'}`}>{title}</h2>
    </div>
  )
}

/** Стеклянная панель — единственный уровень, который несёт backdrop-filter.
 *  Карточки внутри своего блюра не получают: он дорожает линейно по числу
 *  слоёв, а визуально хватает того, что панель под ними уже размыта. */
export function GlassPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass glass-blur rounded-3xl ${className || ''}`}>
      {children}
    </div>
  )
}
