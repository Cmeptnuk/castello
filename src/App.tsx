import { useState, useEffect, useRef, useSyncExternalStore } from 'react'
import { ShoppingCart, Plus, Check, Menu, X } from 'lucide-react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'
import { SLIDE_KEYS, slideFromPath } from './slides.ts'

/* Значение не меняется за время жизни страницы, поэтому подписка пустая.
   useSyncExternalStore нужен ради серверного снимка: на сервере возвращается
   false, и первый клиентский рендер совпадает с присланной разметкой. */
const noSubscribe = () => () => {}
const serverFalse = () => false
const HOVER_QUERY = '(hover: hover) and (pointer: fine)'

/* Vercel Resilient Intake: на сборке генерируется случайный путь для скрипта и
   приёма метрик, чтобы он не совпадал с /_vercel/*, который стоит в фильтрах
   блокировщиков. React-сборки пакетов читают этот конфиг из
   process.env.REACT_APP_*, которого в Vite-бандле не существует, поэтому
   разбираем переменную сами. Нет переменной — пустой объект и прежнее поведение. */
type ObservabilityConfig = {
  analytics?: { scriptSrc?: string; viewEndpoint?: string; eventEndpoint?: string }
  speedInsights?: { scriptSrc?: string; endpoint?: string }
}

const observability: ObservabilityConfig = (() => {
  try {
    return JSON.parse(import.meta.env.VITE_VERCEL_OBSERVABILITY_CLIENT_CONFIG || '{}')
  } catch {
    return {}
  }
})()

function SlideFade({ active, delay = 0, children, className }: { active: boolean; delay?: number; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`transition-opacity duration-500 ease-out ${active ? 'opacity-100' : 'opacity-0'} ${className || ''}`}
      style={{ transitionDelay: active ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}

function SectionHeading({ label, title }: { label: string; title: string }) {
  return (
    <div className="text-center mb-3 sm:mb-5">
      <span className="inline-block text-[10px] tracking-[0.25em] uppercase text-white/30 bg-white/[0.04] px-4 py-1.5 rounded-full mb-2 sm:mb-4">{label}</span>
      <h2 className="text-3xl sm:text-4xl font-bold ">{title}</h2>
    </div>
  )
}

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="relative bg-white/[0.02] rounded-xl px-4 sm:px-5 overflow-hidden transition-all duration-300 group hover:bg-white/[0.03] before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent hover:before:via-white/25 after:content-[''] after:absolute after:top-2 after:right-2 after:w-1 after:h-1 after:rounded-full after:bg-white/10 after:opacity-0 group-hover:after:opacity-100 after:transition-opacity after:duration-300">
      <button onClick={onToggle} className="w-full flex items-center justify-between py-4 sm:py-5 text-left text-base sm:text-lg font-medium text-white/80 hover:text-white transition-colors">
        {q}
        <svg className={`w-4 h-4 shrink-0 ml-4 text-white/30 transition-transform duration-300 ${open ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-60 pb-4 sm:pb-5' : 'max-h-0'}`}>
        <p className="text-white/50 text-sm sm:text-base leading-relaxed">{a}</p>
      </div>
    </div>
  )
}

const faqData = [
  { q: 'Как сделать заказ?', a: 'Нажмите на кнопку «Перейти в Telegram-бот» — откроется чат с ботом. Выберите нужную категорию, товар и следуйте инструкциям. Весь процесс занимает несколько минут.' },
  { q: 'Какие способы оплаты доступны?', a: 'Оплата принимается картами РФ, СБП и криптовалютой (TON, USDT TON/TRC-20, Solana). Все способы доступны при оформлении заказа.' },
  { q: 'Нужен ли Discord Nitro для заказа?', a: 'Нет, не обязательно. В нашем каталоге представлены отдельные категории товаров для аккаунтов без Nitro и с Nitro. Вы можете выбрать подходящий вариант.' },
  { q: 'Как быстро я получу товар после оплаты?', a: 'В течение 10–15 минут после подтверждения платежа заказ обрабатывается и товар отправляется.' },
  { q: 'Что такое «украшения» и «наборы»?', a: 'Украшения — это отдельные элементы для профиля Discord (рамка аватара, баннер, цвет ника и т.д.). Наборы представляют собой комплект из нескольких украшений по выгодной цене.' },
  { q: 'Как работает возврат?', a: 'Возврат товара осуществляется только в случае, если проблема возникла по нашей вине. В остальных случаях возврат не предусмотрен.' },
]

type CategoryTab = 'decorations' | 'bundles'
type NitroTab = 'no-nitro' | 'with-nitro'

interface PriceItem { label: string; priceUSD: number; priceRUB: number }

const decorationsNoNitro: PriceItem[] = [
  { label: 'Украшение', priceUSD: 5.99, priceRUB: 139.99 },
  { label: 'Украшение', priceUSD: 7.99, priceRUB: 219.99 },
  { label: 'Украшение', priceUSD: 8.99, priceRUB: 269.99 },
  { label: 'Украшение', priceUSD: 9.99, priceRUB: 319.99 },
  { label: 'Украшение', priceUSD: 10.99, priceRUB: 369.99 },
  { label: 'Украшение', priceUSD: 11.99, priceRUB: 399.99 },
  { label: 'Украшение', priceUSD: 12.99, priceRUB: 439.99 },
  { label: 'Украшение', priceUSD: 15.99, priceRUB: 499.99 },
]

const bundlesNoNitro: PriceItem[] = [
  { label: 'Набор', priceUSD: 10.99, priceRUB: 369.99 },
  { label: 'Набор', priceUSD: 12.99, priceRUB: 439.99 },
  { label: 'Набор', priceUSD: 15.99, priceRUB: 499.99 },
  { label: 'Набор', priceUSD: 17.99, priceRUB: 579.99 },
  { label: 'Набор', priceUSD: 19.99, priceRUB: 709.99 },
  { label: 'Набор', priceUSD: 23.99, priceRUB: 769.99 },
  { label: 'Набор', priceUSD: 28.99, priceRUB: 999.99 },
]

const decorationsWithNitro: PriceItem[] = [
  { label: 'Украшение', priceUSD: 4.99, priceRUB: 119.99 },
  { label: 'Украшение', priceUSD: 5.99, priceRUB: 139.99 },
  { label: 'Украшение', priceUSD: 6.99, priceRUB: 249.99 },
  { label: 'Украшение', priceUSD: 7.99, priceRUB: 299.99 },
  { label: 'Украшение', priceUSD: 8.49, priceRUB: 339.99 },
  { label: 'Украшение', priceUSD: 8.99, priceRUB: 349.99 },
  { label: 'Украшение', priceUSD: 9.99, priceRUB: 419.99 },
  { label: 'Украшение', priceUSD: 11.99, priceRUB: 479.99 },
]

const bundlesWithNitro: PriceItem[] = [
  { label: 'Набор', priceUSD: 8.99, priceRUB: 349.99 },
  { label: 'Набор', priceUSD: 9.99, priceRUB: 419.99 },
  { label: 'Набор', priceUSD: 11.99, priceRUB: 479.99 },
  { label: 'Набор', priceUSD: 13.99, priceRUB: 549.99 },
  { label: 'Набор', priceUSD: 15.99, priceRUB: 666.99 },
  { label: 'Набор', priceUSD: 17.99, priceRUB: 739.99 },
  { label: 'Набор', priceUSD: 22.99, priceRUB: 949.99 },
]

function TiltCard({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const rectRef = useRef<DOMRect | null>(null)
  // Определяется после гидратации: на сервере window нет, а решать это во время
  // рендера значило бы отдать с сервера и с клиента разную разметку.
  const isTouch = useSyncExternalStore(noSubscribe, () => 'ontouchstart' in window, serverFalse)
  const lift = -4
  const onEnter = () => {
    if (!ref.current) return
    rectRef.current = ref.current.getBoundingClientRect()
    ref.current.style.transition = 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    ref.current.style.transform = `translateY(${lift}px)`
  }
  const onMove = (e: React.MouseEvent) => {
    if (isTouch || !ref.current || !rectRef.current) return
    const r = rectRef.current
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    ref.current.style.transition = 'transform 0.08s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    ref.current.style.transform = `perspective(400px) translateY(${lift}px) rotateX(${(y - r.height / 2) / 24}deg) rotateY(${(r.width / 2 - x) / 24}deg)`
  }
  const onLeave = () => {
    if (isTouch || !ref.current) return
    ref.current.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    ref.current.style.transform = 'perspective(400px) rotateX(0deg) rotateY(0deg)'
    setTimeout(() => { if (ref.current) ref.current.style.transition = '' }, 400)
  }
  if (isTouch) {
    return <div className={className} style={style}>{children}</div>
  }
  return <div ref={ref} onMouseEnter={onEnter} onMouseMove={onMove} onMouseLeave={onLeave} className={className} style={style}>{children}</div>
}

function PriceGrid({ items, filler, tabKey, onAdd }: { items: PriceItem[]; filler?: { label: string; desc: string }; tabKey: string; onAdd?: (item: PriceItem) => void }) {
  const [added, setAdded] = useState<Set<number>>(new Set())
  const timers = useRef<(ReturnType<typeof setTimeout> | undefined)[]>([])
  const handleAdd = (i: number, item: PriceItem) => {
    onAdd?.(item)
    setAdded(prev => new Set(prev).add(i))
    clearTimeout(timers.current[i])
    timers.current[i] = setTimeout(() => {
      setAdded(prev => { const next = new Set(prev); next.delete(i); return next })
    }, 1600)
  }
  return (
    <div key={tabKey} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 animate-fade-in">
      {items.map((item, i) => {
        const justAdded = added.has(i)
        return (
        <TiltCard
          key={`${item.priceUSD}-${i}`}
          className="relative bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 sm:p-4 flex items-center justify-between sm:flex-col sm:text-center gap-x-3 sm:gap-x-4 gap-y-1.5 sm:gap-y-2 animate-fade-in group cursor-pointer hover:bg-white/[0.03] hover:border-white/[0.1] hover:shadow-[0_20px_50px_-12px_rgba(255,255,255,0.06)] transition-all duration-1000 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] will-change-transform overflow-hidden before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent hover:before:via-white/25 after:content-[''] after:absolute after:top-2 after:right-2 after:w-1 after:h-1 after:rounded-full after:bg-white/10 after:opacity-0 group-hover:after:opacity-100 after:transition-opacity after:duration-1000"
          style={{ animationDelay: `${0.05 + i * 0.08}s` }}
        >
          <span className="text-xs sm:text-sm text-white/60 font-medium group-hover:text-white/80 transition-colors duration-300">{item.label}</span>
          <div className="flex items-center gap-3">
            <div className="text-right sm:text-center">
              <div className="text-base sm:text-lg font-bold text-white/90">${item.priceUSD}</div>
              <div className="text-[11px] sm:text-xs text-white/30">{item.priceRUB} ₽</div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleAdd(i, item) }}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg relative transition-all duration-200 group/add"
              title={justAdded ? 'Добавлено' : 'Добавить в корзину'}
              style={justAdded ? { backgroundColor: 'rgba(52,211,153,0.15)' } : undefined}
            >
              <Check className={`w-3.5 h-3.5 text-emerald-400 transition-all duration-300 ${justAdded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
              <ShoppingCart className={`w-3.5 h-3.5 text-white/50 absolute transition-all duration-200 ${justAdded ? 'opacity-0 scale-75' : 'opacity-100 scale-100'} group-hover/add:opacity-0 group-hover/add:scale-75`} />
              <Plus className={`w-3.5 h-3.5 text-white/50 absolute transition-all duration-200 ${justAdded ? 'opacity-0 scale-75' : 'opacity-0 scale-75 group-hover/add:opacity-100 group-hover/add:scale-100'}`} />
            </button>
          </div>
        </TiltCard>
      )})}
      {filler && (
        <div
          className="relative bg-white/[0.02] border border-dashed border-white/[0.08] rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center gap-1 hover:bg-white/[0.03] hover:border-white/15 hover:shadow-[0_20px_50px_-12px_rgba(255,255,255,0.06)] transition-all duration-1000 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] animate-fade-in group overflow-hidden before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent"
          style={{ animationDelay: `${0.05 + items.length * 0.08}s` }}
        >
          <span className="text-xs sm:text-sm font-medium text-white/40 group-hover:text-white/60 transition-colors">{filler.label}</span>
          <span className="text-[11px] sm:text-xs text-white/20">{filler.desc}</span>
        </div>
      )}
    </div>
  )
}

function CursorTrail() {
  const dotsRef = useRef<HTMLDivElement[]>([])
  const pos = useRef({ x: 0, y: 0 })
  const raf = useRef(0)
  // На тач-устройствах мыши нет, но rAF-цикл и mix-blend-difference на 10 точках
  // всё равно пересчитывались бы каждый кадр — чистая трата кадрового бюджета.
  const enabled = useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(HOVER_QUERY)
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    },
    () => window.matchMedia(HOVER_QUERY).matches,
    serverFalse,
  )

  useEffect(() => {
    if (!enabled) return
    const dots = dotsRef.current
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY }
    }
    const animate = () => {
      let cx = pos.current.x
      let cy = pos.current.y
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i]
        if (!dot) continue
        const px = parseFloat(dot.dataset.cx || String(cx))
        const py = parseFloat(dot.dataset.cy || String(cy))
        const nx = px + (cx - px) * (0.18 - i * 0.008)
        const ny = py + (cy - py) * (0.18 - i * 0.008)
        dot.dataset.cx = String(nx)
        dot.dataset.cy = String(ny)
        dot.style.transform = `translate(${nx}px, ${ny}px)`
        cx = nx
        cy = ny
      }
      raf.current = requestAnimationFrame(animate)
    }
    window.addEventListener('mousemove', onMove)
    raf.current = requestAnimationFrame(animate)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf.current)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50" style={{ isolation: 'isolate' }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { if (el) dotsRef.current[i] = el }}
          className="absolute top-0 left-0 rounded-full bg-white mix-blend-difference -translate-x-1/2 -translate-y-1/2"
          style={{
            width: `${4 - i * 0.3}px`,
            height: `${4 - i * 0.3}px`,
            opacity: 0.7 - i * 0.06,
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  )
}

/* Корзина живёт в localStorage, а его на сервере нет. Читать её прямо в
   useState нельзя: разметка с сервера пришла бы с пустой корзиной, а первый
   рендер клиента — с заполненной, и гидратация сломалась бы у всех, кто уже
   что-то отложил. useSyncExternalStore решает это штатно: при гидратации
   берётся серверный снимок, следом React перерисовывает уже с клиентским. */
const CART_KEY = 'cart'
const EMPTY_CART: PriceItem[] = []
const cartListeners = new Set<() => void>()
let cartRaw: string | null = null
let cartSnapshot: PriceItem[] = EMPTY_CART

function readCart(): PriceItem[] {
  let raw: string | null = null
  try { raw = localStorage.getItem(CART_KEY) } catch { /* хранилище недоступно */ }
  // Снимок обязан быть стабильным по ссылке, иначе useSyncExternalStore
  // уйдёт в бесконечную перерисовку — поэтому парсим только при изменении.
  if (raw !== cartRaw) {
    cartRaw = raw
    try { cartSnapshot = raw ? JSON.parse(raw) : EMPTY_CART } catch { cartSnapshot = EMPTY_CART }
  }
  return cartSnapshot
}

function writeCart(next: PriceItem[]) {
  cartSnapshot = next
  cartRaw = JSON.stringify(next)
  try { localStorage.setItem(CART_KEY, cartRaw) } catch { /* приватный режим, блокировка cookie, in-app браузер */ }
  cartListeners.forEach((notify) => notify())
}

const subscribeCart = (notify: () => void) => {
  cartListeners.add(notify)
  return () => { cartListeners.delete(notify) }
}
const serverCart = () => EMPTY_CART

const totalSlides = SLIDE_KEYS.length

function App({ initialSlide = 0 }: { initialSlide?: number }) {
  // Стартовый слайд виден с первого кадра, а не после монтирования: иначе весь
  // первый экран красится прозрачным и Chrome не находит кандидата на LCP.
  const initialClass = (i: number) => (i === initialSlide ? ' slide-initial' : '')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [category, setCategory] = useState<CategoryTab>('decorations')
  const [nitroFilter, setNitroFilter] = useState<NitroTab>('no-nitro')
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [slide, setSlide] = useState(initialSlide)
  const [menuOpen, setMenuOpen] = useState(false)
  const cart = useSyncExternalStore(subscribeCart, readCart, serverCart)
  const [cartOpen, setCartOpen] = useState(false)
  const [toast, setToast] = useState('')
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const onAdd = (item: PriceItem) => {
    writeCart([...cart, item])
    setToast('Товар добавлен в корзину')
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2000)
  }
  const removeFromCart = (index: number) => writeCart(cart.filter((_, i) => i !== index))

  const slideRef = useRef(initialSlide)
  const slideNodes = useRef<(HTMLDivElement | null)[]>([])
  const busyRef = useRef(false)
  const prevSlide = useRef(slide)
  const [catalogSeq, setCatalogSeq] = useState(0)
  const [paymentSeq, setPaymentSeq] = useState(0)
  useEffect(() => {
    if (slide === 1 && prevSlide.current !== 1) setCatalogSeq(s => s + 1)
    if (slide === 3 && prevSlide.current !== 3) setPaymentSeq(s => s + 1)
    prevSlide.current = slide
  }, [slide])

  const goToSlide = (i: number, replace = false) => {
    const idx = Math.max(0, Math.min(i, totalSlides - 1))
    if (idx === slideRef.current || busyRef.current) return
    const prev = slideRef.current
    const entering = slideNodes.current[idx]
    const leaving = slideNodes.current[prev]
    if (!entering || !leaving) return
    busyRef.current = true
    slideRef.current = idx
    entering.style.zIndex = '20'
    entering.style.opacity = '1'
    entering.style.visibility = 'visible'
    entering.style.pointerEvents = 'auto'
    setSlide(idx)
    const key = SLIDE_KEYS[idx]
    const url = key === 'home' ? '/' : `/${key}`
    if (replace) {
      window.history.replaceState(null, '', url)
    } else {
      window.history.pushState(null, '', url)
    }
    const cleanup = () => {
      busyRef.current = false
      entering.style.zIndex = ''
      leaving.style.zIndex = ''
      leaving.style.visibility = 'hidden'
      leaving.style.pointerEvents = 'none'
      leaving.style.opacity = ''
    }
    setTimeout(cleanup, 650)
  }

  const wheelLockRef = useRef(false)
  const handleWheel = (e: React.WheelEvent) => {
    if (busyRef.current || wheelLockRef.current) return
    wheelLockRef.current = true
    e.preventDefault()
    if (e.deltaY > 0) {
      goToSlide(slideRef.current + 1)
    } else {
      goToSlide(slideRef.current - 1)
    }
    setTimeout(() => { wheelLockRef.current = false }, 800)
  }

  useEffect(() => {
    const initPath = () => {
      const path = window.location.pathname.slice(1)
      const start = slideFromPath(window.location.pathname)
      slideRef.current = start
      slideNodes.current.forEach((el, i) => {
        if (!el) return
        // Дальше видимостью управляют инлайновые стили, класс больше не нужен
        // и мешал бы goToSlide гасить слайд сбросом style.opacity.
        el.classList.remove('slide-initial')
        if (i === start) {
          el.style.zIndex = ''
          el.style.opacity = '1'
          el.style.visibility = 'visible'
          el.style.pointerEvents = 'auto'
        } else {
          el.style.visibility = 'hidden'
          el.style.pointerEvents = 'none'
        }
      })
      setSlide(start)
      if (path !== SLIDE_KEYS[start]) {
        const url = SLIDE_KEYS[start] === 'home' ? '/' : `/${SLIDE_KEYS[start]}`
        window.history.replaceState(null, '', url)
      }
    }
    initPath()
    const handlePop = () => {
      const path = window.location.pathname.slice(1)
      const idx = SLIDE_KEYS.indexOf(path)
      if (idx >= 0) goToSlide(idx, true)
    }
    window.addEventListener('popstate', handlePop)
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        goToSlide(slideRef.current + 1)
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        goToSlide(slideRef.current - 1)
      }
    }
    window.addEventListener('keydown', handleKey)

    return () => {
      window.removeEventListener('popstate', handlePop)
      window.removeEventListener('keydown', handleKey)
    }
  }, [])

  const onMouseMove = (e: React.MouseEvent) => {
    setMousePos({
      x: (e.clientX / window.innerWidth - 0.5) * 2,
      y: (e.clientY / window.innerHeight - 0.5) * 2,
    })
  }

  const currentItems =
    category === 'decorations'
      ? (nitroFilter === 'no-nitro' ? decorationsNoNitro : decorationsWithNitro)
      : (nitroFilter === 'no-nitro' ? bundlesNoNitro : bundlesWithNitro)

  const navItems = [
    { key: 'home', label: 'Главная' },
    { key: 'catalog', label: 'Каталог' },
    { key: 'how', label: 'Процесс' },
    { key: 'payment', label: 'Оплата' },
    { key: 'faq', label: 'FAQ' },
    { key: 'discord', label: 'Discord' },
  ]

  return (
    <div className="bg-[#070708] text-white h-svh overflow-hidden" onMouseMove={onMouseMove} onWheel={handleWheel}>
      {/* Пути берутся из Resilient Intake, если Vercel их выдал на сборке —
          иначе пакеты сами подставят штатные /_vercel/*. */}
      <SpeedInsights {...observability.speedInsights} />
      <Analytics {...observability.analytics} />
      <CursorTrail />
      <div className="fixed inset-0 pointer-events-none -z-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundRepeat: 'repeat', backgroundSize: '200px 200px' }} />
      <div className="decor-orbs fixed inset-0 pointer-events-none overflow-hidden -z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/[0.015] rounded-full blur-[120px] transition-transform duration-700 ease-out" style={{ transform: `translate(${mousePos.x * 30}px, ${mousePos.y * 30}px)` }} />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-white/[0.01] rounded-full blur-[150px] transition-transform duration-900 ease-out" style={{ transform: `translate(${mousePos.x * -25}px, ${mousePos.y * -25}px)` }} />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-white/[0.008] rounded-full blur-[100px] transition-transform duration-600 ease-out" style={{ transform: `translate(${mousePos.x * 20}px, ${mousePos.y * -20}px)` }} />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between gap-2 px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center gap-px xs:gap-0.5 sm:gap-1 sm:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)} className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-white/[0.06] flex items-center justify-center hover:bg-white/15 transition-colors" title="Меню">
            {menuOpen ? <X className="w-5 h-5 text-white/60" /> : <Menu className="w-5 h-5 text-white/60" />}
          </button>
        </div>
        <div className="hidden sm:flex items-center gap-px xs:gap-0.5 sm:gap-1">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => goToSlide(SLIDE_KEYS.indexOf(item.key))}
              className={`px-1.5 xs:px-2.5 sm:px-4 py-1 sm:py-1.5 sm:py-2 rounded-lg text-[10px] xs:text-[11px] sm:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                SLIDE_KEYS[slide] === item.key
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-white/30 hover:text-white/50 border border-transparent'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <a
            href="https://t.me/CastelloShop_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-white/[0.06] flex items-center justify-center hover:bg-white/15 transition-colors"
            title="Telegram"
          >
            <svg className="w-5 h-5 text-white/60" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
          </a>
          <a
            href="https://discord.gg/uA4vu9CXHE"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-white/[0.06] flex items-center justify-center hover:bg-white/15 transition-colors"
            title="Discord"
          >
            <svg className="w-5 h-5 text-white/60" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612" />
            </svg>
          </a>
          <div className="relative">
            <button onClick={() => setCartOpen(true)} className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-white/[0.06] flex items-center justify-center hover:bg-white/15 transition-colors" title="Корзина">
              <ShoppingCart className="w-5 h-5 text-white/60" />
            </button>
            {cart.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-[3px] bg-white text-[#070708] text-[9px] font-bold flex items-center justify-center pointer-events-none">
                {cart.length}
              </span>
            )}
          </div>
        </div>
      </nav>

      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="relative w-full max-w-sm bg-[#070708] border-l border-white/[0.08] h-full flex flex-col animate-slide-in-right overflow-hidden before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <span className="text-sm font-medium text-white/80">Корзина ({cart.length})</span>
              <button onClick={() => setCartOpen(false)} className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center hover:bg-white/15 transition-colors">
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-white/30 text-sm gap-3">
                <ShoppingCart className="w-10 h-10 text-white/20" />
                <span>Корзина пуста</span>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
                  {cart.map((item, i) => (
                    <div key={i} className="relative flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3 overflow-hidden before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent">
                      <div>
                        <div className="text-sm font-medium text-white/80">{item.label}</div>
                        <div className="text-xs text-white/40">{item.priceRUB} ₽</div>
                      </div>
                      <button onClick={() => removeFromCart(i)} className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center hover:bg-white/15 transition-colors shrink-0 ml-3">
                        <X className="w-3.5 h-3.5 text-white/50" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/[0.06] px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Итого</span>
                    <span className="font-semibold text-white">
                      {cart.reduce((s, i) => s + i.priceRUB, 0).toFixed(2)} ₽
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="fixed inset-0 z-30 sm:hidden bg-[#070708]/95 backdrop-blur-lg flex flex-col items-center justify-center gap-4 animate-fade-in">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => { goToSlide(SLIDE_KEYS.indexOf(item.key)); setMenuOpen(false) }}
              className={`text-lg font-medium transition-colors ${
                SLIDE_KEYS[slide] === item.key ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-white/10 backdrop-blur-md border border-white/15 text-white/90 text-sm px-5 py-2.5 rounded-xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
            {toast}
          </div>
        </div>
      )}

      <div className="relative w-full h-full slide-viewport">
        {/* Slide 0: Hero */}
        <div
          ref={(el) => { slideNodes.current[0] = el }}
          className={`flex slide-section absolute inset-0 items-center justify-center${initialClass(0)}`}
          style={{ zIndex: 0 }}
        >
          <SlideFade active={slide === 0} delay={100}>
            <div className="flex flex-col items-center justify-center h-full px-6 max-w-4xl mx-auto">
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04)_0%,transparent_60%)]" />
              <div className="animate-rise-in text-center" style={{ animationDelay: '0.1s' }}>
                <span className="relative inline-block text-[10px] tracking-[0.3em] uppercase text-white/30 bg-white/[0.04] px-5 py-2 rounded-full overflow-hidden before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent">Castello Shop</span>
              </div>
              <div className="animate-rise-in mt-4 text-center" style={{ animationDelay: '0.2s' }}>
                <h1 className="text-4xl xs:text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight leading-none">
                  <span className="bg-gradient-to-r from-white via-gray-200 to-white/40 bg-clip-text text-transparent">Castello</span>
                </h1>
              </div>
              <div className="animate-rise-in mt-3 text-center" style={{ animationDelay: '0.35s' }}>
                <p className="text-white/40 text-base sm:text-lg max-w-xl leading-relaxed">
                  Кастомизация Discord: украшения и наборы для профиля. Без Nitro и с Nitro.
                </p>
              </div>
              <div className="animate-rise-in mt-6" style={{ animationDelay: '0.5s' }}>
                <a href="https://t.me/CastelloShop_bot" target="_blank" rel="noopener noreferrer"
                  className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-[#070708] font-semibold text-base rounded-2xl transition-all duration-300 hover:bg-gray-100 hover:scale-[1.03] active:scale-95"
                >
                  <span className="absolute -inset-1 rounded-2xl bg-white/15 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="relative flex items-center gap-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                    Перейти в Telegram-бот
                  </span>
                </a>
              </div>
              <div className="animate-rise-in mt-4 text-center" style={{ animationDelay: '0.6s' }}>
                  <p className="text-white/20 text-xs">Оформление заказа через сайт — быстро и безопасно</p>
              </div>
            </div>
          </SlideFade>
        </div>

        {/* Slide 1: Catalog */}
        <div
          ref={(el) => { slideNodes.current[1] = el }}
          className={`slide-section absolute inset-0 flex items-center justify-center${initialClass(1)}`}
          style={{ zIndex: 0 }}
        >
          <SlideFade active={slide === 1} delay={100} className="h-full w-full">
            <div className="overflow-y-auto h-full px-4 sm:px-6 max-w-5xl mx-auto flex flex-col justify-center items-center py-8">
              <SectionHeading label="Каталог" title="Цены на украшения и наборы" />

              <div className="flex justify-center gap-2 mb-2 flex-wrap">
                {[
                  { key: 'decorations' as const, label: 'Украшения' },
                  { key: 'bundles' as const, label: 'Наборы' },
                ].map((tab) => (
                  <button key={tab.key} onClick={() => setCategory(tab.key)}
                    className={`px-4 xs:px-6 py-2 xs:py-3 rounded-xl font-medium text-xs xs:text-sm transition-all duration-200 ${
                      category === tab.key
                        ? 'bg-white text-[#070708] shadow-lg shadow-white/10'
                        : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/80'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex justify-center gap-2 mb-6 flex-wrap">
                {[
                  { key: 'no-nitro' as const, label: 'Без Nitro' },
                  { key: 'with-nitro' as const, label: 'С Nitro' },
                ].map((tab) => (
                  <button key={tab.key} onClick={() => setNitroFilter(tab.key)}
                    className={`px-3 xs:px-5 py-1.5 xs:py-2 rounded-lg text-[10px] xs:text-xs font-medium tracking-wider transition-all duration-200 ${
                      nitroFilter === tab.key
                        ? 'bg-white/10 text-white border border-white/20'
                        : 'text-white/30 hover:text-white/50 border border-transparent'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <PriceGrid
                key={`${category}-${catalogSeq}`}
                items={currentItems}
                filler={category === 'bundles' ? { label: 'Свой вариант', desc: 'Напиши в бот' } : undefined}
                tabKey={category}
                onAdd={onAdd}
              />

              <div className="text-center mt-4 sm:mt-6 animate-fade-in shrink-0" style={{ animationDelay: '0.6s' }}>
                <a href="https://t.me/CastelloShop_bot" target="_blank" rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 px-4 xs:px-6 py-2 xs:py-3 bg-white/[0.04] border border-white/[0.08] text-white/60 font-medium rounded-xl hover:bg-white/[0.07] hover:border-white/15 hover:text-white/80 transition-all duration-200 text-xs xs:text-sm"
                >
                  Посмотреть все товары в Telegram
                  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </a>
              </div>
            </div>
          </SlideFade>
        </div>

        {/* Slide 2: How it works */}
        <div
          ref={(el) => { slideNodes.current[2] = el }}
          className={`slide-section absolute inset-0 flex items-center justify-center${initialClass(2)}`}
          style={{ zIndex: 0 }}
        >
          <SlideFade active={slide === 2} delay={100} className="h-full w-full">
            <div className="overflow-y-auto h-full px-4 sm:px-6 max-w-4xl mx-auto flex flex-col items-center justify-center py-6">
              <SectionHeading label="Процесс" title="Как сделать заказ" />

              <div className="relative w-full max-w-3xl mx-auto mt-2 sm:mt-4">
                {/* Central line */}
                <div className="absolute left-6 sm:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-transparent -translate-x-1/2" />

                {[
                  { step: '01', title: 'Оформление заказа', desc: 'Добавьте товары в корзину и укажите данные Discord.' },
                  { step: '02', title: 'Оплата', desc: 'Выберите способ оплаты и оплатите заказ на сайте.' },
                  { step: '03', title: 'Предоставление данных', desc: 'Вы передаёте данные от аккаунта Discord для входа.' },
                  { step: '04', title: 'Продавец заходит в аккаунт', desc: 'Мы получаем доступ к вашему аккаунту Discord.' },
                  { step: '05', title: 'Оформление покупки', desc: 'Продавец приобретает украшения через ваш аккаунт.' },
                  { step: '06', title: 'Заказ завершён', desc: 'Подтверждаем выполнение — вы получаете готовый профиль.' },
                ].map((item, i) => {
                  const isLeft = i % 2 === 0
                  return (
                    <div key={item.step} className={`relative flex items-start gap-6 sm:gap-0 ${isLeft ? 'sm:flex-row' : 'sm:flex-row-reverse'} animate-fade-in mb-2 sm:mb-0`} style={{ animationDelay: `${0.05 + i * 0.1}s` }}>
                      {/* Dot on the line */}
                      <div className="relative z-10 shrink-0 w-12 sm:w-0 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-white/10 border border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.06)] sm:absolute sm:left-1/2 sm:-translate-x-1/2" />
                        <div className="absolute w-3 h-3 rounded-full bg-white/10 animate-ping opacity-50 sm:left-1/2 sm:-translate-x-1/2" style={{ animationDuration: '2.5s' }} />
                      </div>

                      {/* Card */}
                      <div className={`flex-1 sm:w-1/2 ${isLeft ? 'sm:pr-10 sm:text-right' : 'sm:pl-10'}`}>
                        <div className={`relative bg-white/[0.015] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 sm:p-5 overflow-hidden transition-all duration-1000 group before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent hover:before:via-white/25 after:content-[''] after:absolute after:top-2 after:right-2 after:w-1 after:h-1 after:rounded-full after:bg-white/10 after:opacity-0 group-hover:after:opacity-100 after:transition-opacity after:duration-300
                          ${isLeft ? 'sm:hover:-translate-y-1 sm:hover:translate-x-1' : 'sm:hover:-translate-y-1 sm:hover:-translate-x-1'}
                          hover:bg-white/[0.03] hover:border-white/[0.1] hover:shadow-[0_20px_50px_-12px_rgba(255,255,255,0.06)]
                        `}>
                          {/* Background step number */}
                          <div className={`absolute -top-2 ${isLeft ? 'sm:-left-2' : 'sm:-right-2'} text-[90px] sm:text-[110px] font-bold leading-none select-none pointer-events-none text-white opacity-[0.02]`}>
                            {item.step}
                          </div>

                          <div className={`relative flex items-center gap-4 sm:gap-5 ${isLeft ? 'sm:flex-row-reverse' : ''}`}>
                            {/* Icon container */}
                            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 group-hover:bg-white/[0.06] group-hover:border-white/[0.1] transition-all duration-300">
                              {i === 0 ? (
                                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white/40 group-hover:text-white/60 transition-colors" />
                              ) : i === 1 ? (
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white/40 group-hover:text-white/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                                </svg>
                              ) : i === 2 ? (
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white/40 group-hover:text-white/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                                </svg>
                              ) : i === 3 ? (
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white/40 group-hover:text-white/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                              ) : i === 4 ? (
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white/40 group-hover:text-white/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white/40 group-hover:text-white/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </div>
                            <div className={`flex-1 min-w-0 ${isLeft ? 'sm:text-right' : ''}`}>
                              <div className={`flex items-center gap-2 ${isLeft ? 'sm:flex-row-reverse sm:justify-end' : ''}`}>
                                <span className="text-[10px] sm:text-[11px] tracking-wider font-mono text-white/20">
                                  {item.step}
                                </span>
                                <h3 className="text-sm sm:text-base font-semibold text-white/70 group-hover:text-white/90 transition-colors">{item.title}</h3>
                              </div>
                              <p className="text-white/30 text-xs sm:text-sm mt-0.5 leading-relaxed">{item.desc}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </SlideFade>
        </div>

        {/* Slide 3: Payment */}
        <div
          ref={(el) => { slideNodes.current[3] = el }}
          className={`slide-section absolute inset-0 flex items-center justify-center${initialClass(3)}`}
          style={{ zIndex: 0 }}
        >
          <SlideFade active={slide === 3} delay={100}>
            <div key={`payment-${paymentSeq}`} className="overflow-y-auto h-full px-4 sm:px-6 max-w-2xl mx-auto flex flex-col items-center justify-center py-6">
              <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-white/30 bg-white/[0.04] px-4 py-1.5 rounded-full mb-3">
                <svg className="w-3 h-3 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                Безопасная оплата
              </span>

              <SectionHeading label="Оплата" title="Доступные способы" />

              {/* Credit Card Visual */}
              <TiltCard className="relative w-full max-w-xs mx-auto mb-6 sm:mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="relative aspect-[1.586/1] rounded-2xl bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-transparent border border-white/[0.08] p-5 sm:p-6 overflow-hidden before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
                  <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-gradient-to-br from-white/[0.06] to-transparent blur-xl" />
                  <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-gradient-to-tr from-white/[0.04] to-transparent blur-lg" />
                  <div className="relative flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] tracking-[0.2em] uppercase text-white/30">Castello</span>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-white/10 border border-white/[0.08]" />
                        <div className="w-3 h-3 rounded-full bg-white/10 border border-white/[0.08]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-1">
                          {[0,1,2,3].map(i => (
                            <div key={i} className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white/[0.08]" />
                          ))}
                        </div>
                        <span className="text-lg sm:text-xl tracking-wider text-white/40 font-mono">4242</span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-white/20">
                        <span>VALID THRU 12/28</span>
                        <span>•••</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TiltCard>

              {/* Payment Methods */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 w-full max-w-2xl mx-auto">
                {[
                  {
                    label: 'Банковские карты',
                    desc: 'Visa, Mastercard, МИР',
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                    ),
                  },
                  {
                    label: 'СБП',
                    desc: 'Моментальный перевод',
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    ),
                  },
                  {
                    label: 'Криптовалюта',
                    desc: 'TON, USDT (TON / TRC-20), Solana',
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ),
                  },
                ].map((method, i) => (
                  <TiltCard key={method.label}
                    className="relative flex sm:flex-col items-center sm:text-center gap-3 sm:gap-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3 sm:p-4 sm:pt-6 animate-fade-in overflow-hidden group cursor-default hover:bg-white/[0.03] hover:border-white/[0.1] hover:shadow-[0_20px_50px_-12px_rgba(255,255,255,0.06)] transition-all duration-1000 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent hover:before:via-white/25 after:content-[''] after:absolute after:top-2 after:right-2 after:w-1 after:h-1 after:rounded-full after:bg-white/10 after:opacity-0 group-hover:after:opacity-100 after:transition-opacity after:duration-1000"
                    style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
                    <div className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.06] border border-white/[0.06] flex items-center justify-center">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        {method.icon}
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-semibold text-white/80">{method.label}</div>
                      <p className="text-white/30 text-xs sm:text-sm mt-0.5">{method.desc}</p>
                    </div>
                  </TiltCard>
                ))}
              </div>
            </div>
          </SlideFade>
        </div>

        {/* Slide 4: FAQ */}
        <div
          ref={(el) => { slideNodes.current[4] = el }}
          className={`slide-section absolute inset-0 flex items-center justify-center${initialClass(4)}`}
          style={{ zIndex: 0 }}
        >
          <SlideFade active={slide === 4} delay={100}>
            <div className="overflow-y-auto h-full px-4 sm:px-6 max-w-2xl mx-auto flex flex-col items-center justify-center py-6">
              <SectionHeading label="FAQ" title="Частые вопросы" />
              <div className="w-full mt-2 sm:mt-4">
                {faqData.map((item, i) => (
                  <FaqItem key={item.q} q={item.q} a={item.a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
                ))}
              </div>
            </div>
          </SlideFade>
        </div>

        {/* Slide 5: Discord + CTA + Footer */}
        <div
          ref={(el) => { slideNodes.current[5] = el }}
          className={`slide-section absolute inset-0 flex items-center justify-center mt-30${initialClass(5)}`}
          style={{ zIndex: 0 }}
        >
          <SlideFade active={slide === 5} delay={100}>
            <div className="overflow-y-auto h-full px-4 sm:px-6 max-w-3xl mx-auto flex flex-col items-center justify-center py-6">
              <div className="relative bg-white/[0.02] border border-white/[0.06] rounded-2xl sm:rounded-3xl p-5 sm:p-10 text-center hover:bg-white/[0.03] transition-colors overflow-hidden group before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent hover:before:via-white/25 after:content-[''] after:absolute after:top-3 after:right-3 after:w-1 after:h-1 after:rounded-full after:bg-white/10 after:opacity-0 group-hover:after:opacity-100 after:transition-opacity after:duration-300">
                <span className="inline-block text-[10px] tracking-[0.25em] uppercase text-white/30 bg-white/[0.04] px-4 py-1.5 rounded-full mb-3">Сообщество</span>
                <h2 className="text-2xl sm:text-3xl font-bold mt-2">Присоединяйтесь к Discord</h2>
                <p className="text-white/40 text-sm sm:text-base mt-2 max-w-lg mx-auto leading-relaxed">
                  Общайтесь с другими пользователями, получайте новости и участвуйте в закрытых распродажах.
                </p>
                <a href="https://discord.gg/uA4vu9CXHE" target="_blank" rel="noopener noreferrer"
                  className="group relative inline-flex items-center gap-3 px-6 py-3 bg-[#5865F2] text-white font-semibold text-sm sm:text-base rounded-2xl transition-all duration-300 hover:bg-[#4752c4] hover:scale-[1.03] active:scale-95 mt-4">
                  <span className="absolute -inset-1 rounded-2xl bg-[#5865F2]/20 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="relative flex items-center gap-3">
                    <svg className="w-5 h-5" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612" />
                    </svg>
                  </span>
                </a>
              </div>

              <div className="text-center mt-4 sm:mt-6">
                  <h2 className="text-2xl sm:text-3xl font-bold">Готовы начать?</h2>
                  <p className="text-white/40 text-sm sm:text-base mt-2">Нажмите кнопку и выберите то, что подходит именно вам.</p>
                <a href="https://t.me/CastelloShop_bot" target="_blank" rel="noopener noreferrer"
                  className="relative inline-flex items-center gap-3 px-8 py-3 sm:py-4 bg-white text-[#070708] font-semibold text-sm sm:text-base rounded-2xl mt-4"
                >
                  <span className="relative flex items-center gap-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                    Перейти в Telegram-бот
                  </span>
                </a>
              </div>

              <footer className="flex flex-col items-center text-center mt-30 border-t border-white/[0.04] pt-3 sm:pt-4 animate-fade-in" style={{ animationDelay: '2s' }}>
                {/* Год на сборке и год у посетителя могут разойтись после Нового года —
                    для React это расхождение разметки, а тут оно безобидно. */}
                <p suppressHydrationWarning className="mb-2 text-white/20 text-[10px] sm:text-xs">Castello Shop &copy; {new Date().getFullYear()}</p>
                <div className="relative bg-white/[0.04] border border-white/[0.06] rounded-2xl px-4 py-3 inline-block overflow-hidden before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent">
                  <p className="text-white/60 text-xs sm:text-sm font-medium mb-1">ИП Бережной Егор Станиславович</p>
                  <p className="text-white/30 text-[10px] sm:text-xs">ИНН 910824288444 &nbsp;|&nbsp; ОГРНИП 325911200146721</p>
                </div>
              </footer>
            </div>
          </SlideFade>
        </div>
      </div>
    </div>
  )
}

export default App
