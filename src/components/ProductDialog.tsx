import { useEffect, useRef, useState } from 'react'
import { X, Check, ShoppingCart } from 'lucide-react'
import { DiscordIcon, TelegramIcon, ShieldCheckIcon } from './icons.tsx'
import type { CatalogCopy, PriceItem } from '../data.ts'

const TITLE_ID = 'product-dialog-title'
const motionDuration = (ms: number) => (
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? Math.min(ms, 480)
    : ms
)

/** Окно товара. Главное, что оно должно сказать: строка прайса — это ценовая
 *  категория, а арт лишь показывает, что за эти деньги бывает. Поэтому оговорка
 *  стоит выше описания и состава, а не сноской под ними. */
export function ProductDialog({ item, copy, telegramUrl, onAdd, onClose }: {
  item: PriceItem
  copy: CatalogCopy
  telegramUrl: string
  onAdd: (item: PriceItem) => void
  onClose: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const [added, setAdded] = useState(false)
  const [closing, setClosing] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const requestClose = () => {
    setClosing(true)
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(onClose, motionDuration(520))
  }

  useEffect(() => {
    // Фокус уходит в окно, иначе с клавиатуры остаёшься на карточке под ним.
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setClosing(true)
      clearTimeout(closeTimer.current)
      closeTimer.current = setTimeout(onClose, motionDuration(520))
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearTimeout(timer.current)
      clearTimeout(closeTimer.current)
    }
  }, [onClose])

  const handleAdd = () => {
    onAdd(item)
    setAdded(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setAdded(false), 1600)
  }

  return (
    <div
      className={`product-overlay fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 ${closing ? 'is-exiting' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={TITLE_ID}
    >
      <div className="overlay-backdrop absolute inset-0 bg-black/70" onClick={requestClose} />
      <div
        className="product-dialog glass glass-blur relative w-full max-w-xl max-h-[86svh] rounded-3xl overflow-hidden flex flex-col"
      >
        <button
          ref={closeRef}
          onClick={requestClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-lg bg-black/45 flex items-center justify-center hover:bg-black/70 transition-colors"
          aria-label="Закрыть окно товара"
        >
          <X className="w-4 h-4 text-white/70" />
        </button>

        {item.art ? (
          /* Здесь арт показан целиком, без кадрирования как в плитке: в окне у
             промо-картинки есть место, и это тот самый вид, который покупатель
             потом увидит в боте. */
          <div className="relative shrink-0 aspect-[16/9] bg-white/[0.03]">
            <img src={item.art} alt="" decoding="async" className="w-full h-full object-cover" />
            <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/60 to-transparent" />
            <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/55 text-[10px] tracking-wide text-white/75">
              Пример из категории
            </span>
          </div>
        ) : (
          <div className="relative shrink-0 h-24 flex items-center justify-center bg-gradient-to-b from-white/[0.05] to-transparent">
            <DiscordIcon className="w-9 h-9 text-white/[0.08]" />
          </div>
        )}

        <div className="product-dialog-body flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="min-w-0">
              <span className="text-[10px] tracking-[0.25em] uppercase text-white/30">Ценовая категория</span>
              <h3 id={TITLE_ID} className="text-xl sm:text-2xl font-bold mt-1">
                {copy.noun} за ${item.priceUSD}
              </h3>
            </div>
            <div className="shrink-0 text-right leading-tight">
              <div className="text-lg sm:text-xl font-bold tabular-nums">{item.priceRUB} ₽</div>
              <div className="text-[11px] text-white/30 tabular-nums">${item.priceUSD}</div>
            </div>
          </div>

          {/* Оговорка про категорию — на индиговом рельсе, тем же приёмом, что
              помечает раскрытый вопрос в FAQ: это утверждение, а не подпись. */}
          <div className="relative pl-4">
            <span aria-hidden className="absolute left-0 inset-y-0 w-[2px] rounded-full bg-brand" />
            <p className="text-sm text-white/60 leading-relaxed">
              {item.art
                ? `На картинке — один из вариантов за $${item.priceUSD}, а не тот самый товар. Вы берёте саму категорию: что именно оформить в её пределах, выбираете в боте.`
                : `Вы берёте категорию за $${item.priceUSD}. Что именно оформить в её пределах, выбираете в боте.`}
            </p>
          </div>

          <p className="text-sm text-white/50 leading-relaxed">{copy.about}</p>

          <div>
            <span className="text-[10px] tracking-[0.25em] uppercase text-white/30">Что входит</span>
            <ul className="mt-2.5 flex flex-col gap-1.5">
              {copy.includes.map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-sm text-white/70">
                  <Check className="w-3.5 h-3.5 mt-1 shrink-0 text-brand" />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass rounded-xl flex items-start gap-3 px-4 py-3">
            <ShieldCheckIcon className="w-4 h-4 mt-0.5 shrink-0 text-white/40" />
            <span className="text-xs sm:text-sm text-white/50 leading-relaxed">{copy.account}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-[#070708] font-semibold text-sm hover:bg-gray-100 transition-colors"
            >
              {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
              {added ? 'Добавлено' : 'Добавить в корзину'}
            </button>
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/[0.05] text-white/70 font-medium text-sm hover:bg-white/[0.1] hover:text-white/90 transition-colors"
            >
              <TelegramIcon className="w-4 h-4" />
              Выбрать в боте
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
