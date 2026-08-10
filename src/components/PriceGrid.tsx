import { useRef, useState } from 'react'
import { ShoppingCart, Plus, Check } from 'lucide-react'
import { TiltCard } from './TiltCard.tsx'
import { DiscordIcon } from './icons.tsx'
import type { PriceItem } from '../data.ts'

export function PriceGrid({ items, filler, tabKey, onAdd, onOpen }: { items: PriceItem[]; filler?: { label: string; desc: string }; tabKey: string; onAdd?: (item: PriceItem) => void; onOpen?: (item: PriceItem) => void }) {
  const [added, setAdded] = useState<Set<number>>(new Set())
  const timers = useRef<(ReturnType<typeof setTimeout> | undefined)[]>([])
  const hasArt = items.some((item) => item.art)

  const handleAdd = (i: number, item: PriceItem) => {
    onAdd?.(item)
    setAdded(prev => new Set(prev).add(i))
    clearTimeout(timers.current[i])
    timers.current[i] = setTimeout(() => {
      setAdded(prev => { const next = new Set(prev); next.delete(i); return next })
    }, 1600)
  }

  return (
    <div key={tabKey} className="animate-fade-in">
      {/* Четыре колонки — потолок: в любой категории ровно восемь плиток, и на
          четырёх они складываются в два полных ряда, а на пяти последний ряд
          остаётся рваным. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
      {items.map((item, i) => {
        const justAdded = added.has(i)
        return (
          <TiltCard
            key={`${item.priceUSD}-${i}`}
            role="button"
            tabIndex={0}
            aria-label={`${item.label} за ${item.priceRUB} ₽ — подробнее о категории`}
            onClick={() => onOpen?.(item)}
            onKeyDown={(e) => {
              // Только своё нажатие: Enter на кнопке корзины внутри карточки
              // всплывает сюда и открывал бы окно заодно с добавлением.
              if (e.target !== e.currentTarget) return
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onOpen?.(item)
              }
            }}
            className="glass glass-sheen glass-tinted rounded-2xl p-2 sm:p-2.5 flex flex-col gap-2 sm:gap-2.5 animate-fade-in group cursor-pointer transition-[background-color] duration-500 hover:bg-white/[0.07]"
            style={{ animationDelay: `${0.05 + i * 0.08}s` }}
          >
            {/* Превью уже квадратное и обрезано на сборке: слева на арте свой
                текстовый блок с ценой, снизу полоса со способами оплаты — в
                плитке они спорили бы с ценой самого каталога. Остаётся то,
                ради чего арт и нужен, — сам товар. */}
            <div className="relative aspect-square rounded-xl overflow-hidden bg-white/[0.03] ring-1 ring-inset ring-white/[0.06] transition-[box-shadow] duration-500 group-hover:ring-white/15">
              {item.thumb ? (
                <img
                  src={item.thumb}
                  alt=""
                  width={400}
                  height={400}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                />
              ) : (
                /* Арт для этой группы ещё не нарисован. Пустой кадр с меткой
                   Discord честнее подстановки чужой картинки: показать здесь
                   арт набора значило бы показать не тот товар. */
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-white/[0.05] to-transparent">
                  <DiscordIcon className="w-8 h-8 text-white/[0.07] transition-colors duration-500 group-hover:text-white/[0.12]" />
                </div>
              )}
              {/* Арт заканчивается резкой кромкой — растворяем низ в стекле,
                  иначе плитка читается как наклейка поверх карточки. */}
              <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
              {item.art && (
                /* Метка стоит на самой картинке, а не под ней: спутать товар с
                   артом можно только глядя на арт. */
                <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/55 text-[9px] tracking-wide text-white/70">
                  Пример
                </span>
              )}
              <span className="absolute left-2 bottom-1.5 text-[10px] font-medium tracking-wide text-white/60 group-hover:text-white/85 transition-colors duration-300">
                {item.label}
              </span>
              <span aria-hidden className="absolute right-2 bottom-1.5 text-[10px] font-medium text-white/0 group-hover:text-white/70 transition-colors duration-300">
                Подробнее
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 px-1 pb-0.5">
              <div className="min-w-0 leading-tight">
                <div className="text-sm sm:text-base font-bold text-white/90 tabular-nums">${item.priceUSD}</div>
                <div className="text-[10px] sm:text-[11px] text-white/30 tabular-nums">{item.priceRUB} ₽</div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleAdd(i, item) }}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg relative bg-white/[0.05] transition-all duration-200 group/add hover:bg-white/[0.1]"
                aria-label={justAdded ? 'Добавлено в корзину' : `Добавить в корзину за ${item.priceRUB} ₽`}
                style={justAdded ? { backgroundColor: 'rgba(52,211,153,0.15)' } : undefined}
              >
                <Check className={`w-3.5 h-3.5 text-emerald-400 transition-all duration-300 ${justAdded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
                <ShoppingCart className={`w-3.5 h-3.5 text-white/50 absolute transition-all duration-200 ${justAdded ? 'opacity-0 scale-75' : 'opacity-100 scale-100'} group-hover/add:opacity-0 group-hover/add:scale-75`} />
                <Plus className={`w-3.5 h-3.5 text-white/70 absolute transition-all duration-200 ${justAdded ? 'opacity-0 scale-75' : 'opacity-0 scale-75 group-hover/add:opacity-100 group-hover/add:scale-100'}`} />
              </button>
            </div>
          </TiltCard>
        )
      })}
      {filler && (
        /* Повторяет ритм плитки с артом — рамка, кадр, подпись, — чтобы
           последняя ячейка не выпадала из ряда. Арта у неё нет и не будет:
           это не товар, а приглашение написать в бот. */
        <div
          className="rounded-2xl border border-dashed border-white/[0.08] p-2 sm:p-2.5 flex flex-col gap-2 sm:gap-2.5 hover:border-white/15 transition-colors duration-500 animate-fade-in group"
          style={{ animationDelay: `${0.05 + items.length * 0.08}s` }}
        >
          <div className="aspect-square rounded-xl bg-white/[0.02] flex items-center justify-center">
            <span className="w-9 h-9 rounded-full border border-dashed border-white/15 flex items-center justify-center text-white/25 transition-colors duration-500 group-hover:border-white/25 group-hover:text-white/50">
              <Plus className="w-4 h-4" />
            </span>
          </div>
          <div className="px-1 pb-0.5 leading-tight">
            <div className="text-xs sm:text-sm font-medium text-white/40 group-hover:text-white/60 transition-colors">{filler.label}</div>
            <div className="text-[10px] sm:text-[11px] text-white/20 mt-0.5">{filler.desc}</div>
          </div>
        </div>
      )}
      </div>

      {/* Оговорка одна на сетку, а не на каждой плитке: восемь копий одного
          текста — шум, а рядом с прайсом её всё равно читают как правило для
          всего списка. Без арта путать не с чем — тогда остаётся приглашение
          открыть карточку. */}
      <p className="mt-3 text-[11px] sm:text-xs text-white/25 leading-relaxed">
        {hasArt
          ? 'Цена — это категория, а не конкретный товар на картинке: арт показывает один из вариантов за эти деньги. Нажмите на карточку, чтобы прочитать подробнее.'
          : 'Цена — это категория товара. Нажмите на карточку, чтобы прочитать подробнее.'}
      </p>
    </div>
  )
}
