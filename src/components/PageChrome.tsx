import { navItems, TELEGRAM_URL } from '../data.ts'

/** Постоянный слой по краям экрана: углы, вертикальные подписи, сетка и
 *  нижняя строка с пагинацией. Живёт вне .slide-viewport, поэтому не
 *  перерисовывается при смене слайда и не участвует в переходах.
 *
 *  Кликабельны только точки пагинации — остальное decorative и скрыто от
 *  скринридеров: содержание слайда они не дублируют. */
export function PageChrome({ slide, onSelect }: { slide: number; onSelect: (i: number) => void }) {
  const section = navItems[slide]?.label ?? ''
  const total = navItems.length

  return (
    <>
      <div aria-hidden className="chrome-grid fixed inset-0 pointer-events-none -z-0" />

      <div aria-hidden className="fixed inset-0 z-20 pointer-events-none">
        <span className="chrome-corner chrome-corner--tl" />
        <span className="chrome-corner chrome-corner--tr" />
        <span className="chrome-corner chrome-corner--bl" />
        <span className="chrome-corner chrome-corner--br" />

        {/* Марка слева, раздел справа — рельсы забирают поля, которые иначе
            остаются пустыми на широком экране. */}
        <span
          className="chrome-vtext absolute left-(--chrome-pad) top-1/2 -translate-y-1/2 text-[8px] sm:text-[10px] tracking-[0.4em] uppercase text-white/12 select-none"
        >
          Castello Shop
        </span>
        <span
          key={section}
          className="chrome-vtext absolute right-(--chrome-pad) top-1/2 -translate-y-1/2 text-[8px] sm:text-[10px] tracking-[0.4em] uppercase text-brand/40 select-none animate-fade-in"
        >
          {section}
        </span>
      </div>

      <div className="fixed inset-x-0 bottom-(--chrome-pad) z-20 pointer-events-none flex items-center justify-center px-14 sm:px-20">
        <span aria-hidden className="hidden sm:block absolute left-20 text-[10px] tracking-wider text-white/12 select-none">
          {TELEGRAM_URL.replace('https://', '')}
        </span>

        <nav aria-label="Слайды" className="pointer-events-auto flex items-center gap-3">
          <span aria-hidden className="font-mono text-[10px] tracking-wider tabular-nums select-none">
            <span className="text-white/40">{String(slide + 1).padStart(2, '0')}</span>
            <span className="text-white/15"> / {String(total).padStart(2, '0')}</span>
          </span>
          <span className="flex items-center gap-1.5">
            {navItems.map((item, i) => (
              <button
                key={item.key}
                onClick={() => onSelect(i)}
                aria-label={item.label}
                aria-current={i === slide ? 'true' : undefined}
                className="group grid h-6 place-items-center px-0.5"
              >
                <span
                  className={`block h-1 rounded-full transition-all duration-500 ease-out ${
                    i === slide
                      ? 'w-5 bg-brand/70'
                      : 'w-1 bg-white/15 group-hover:bg-white/40'
                  }`}
                />
              </button>
            ))}
          </span>
        </nav>

        {/* Подсказка про стрелки — только там, где есть клавиатура: на
            телефоне листают теми же точками, свайпа в приложении нет. */}
        <span aria-hidden className="hidden sm:block absolute right-20 text-[10px] tracking-wider text-white/12 select-none">
          ↑ ↓ листать
        </span>
      </div>
    </>
  )
}
