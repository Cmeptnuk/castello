import { useState, useEffect, useRef } from 'react'
import { ShoppingCart, Menu, X } from 'lucide-react'

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
    <div className="border-b border-white/[0.05]">
      <button onClick={onToggle} className="w-full flex items-center justify-between py-5 text-left text-base sm:text-lg font-medium text-white/80 hover:text-white transition-colors">
        {q}
        <svg className={`w-4 h-4 shrink-0 ml-4 text-white/30 transition-transform duration-300 ${open ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-60 pb-5' : 'max-h-0'}`}>
        <p className="text-white/50 text-sm sm:text-base leading-relaxed">{a}</p>
      </div>
    </div>
  )
}

const faqData = [
  { q: 'Как сделать заказ?', a: 'Нажми на кнопку «Перейти в Telegram-бот» — откроется чат с ботом. Выбери нужную категорию, товар и следуй инструкциям. Весь процесс занимает пару минут.' },
  { q: 'Какие способы оплаты доступны?', a: 'Оплата принимается картами РФ, СБП и криптовалютой (TON, USDT TON/TRC-20, Solana). Все способы доступны внутри Telegram-бота.' },
  { q: 'Нужен ли Discord Nitro для заказа?', a: 'Нет, не обязательно. У нас есть отдельные категории товаров для аккаунтов без Nitro и с Nitro. Выбирай то, что подходит под твой аккаунт.' },
  { q: 'Как быстро я получу товар после оплаты?', a: 'В течение 10–15 минут после подтверждения платежа бот обработает заказ и отправит товар.' },
  { q: 'Что такое «украшения» и «наборы»?', a: 'Украшения — это отдельные элементы для профиля Discord (рамка аватара, баннер, цвет ника и т.д.). Наборы — это комплект из нескольких украшений по выгодной цене.' },
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
  const isTouch = useRef(typeof window !== 'undefined' && 'ontouchstart' in window)
  const onEnter = () => {
    if (!ref.current) return
    rectRef.current = ref.current.getBoundingClientRect()
  }
  const onMove = (e: React.MouseEvent) => {
    if (isTouch.current || !ref.current || !rectRef.current) return
    const r = rectRef.current
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    ref.current.style.transition = 'none'
    ref.current.style.transform = `perspective(400px) rotateX(${(y - r.height / 2) / 16}deg) rotateY(${(r.width / 2 - x) / 16}deg)`
  }
  const onLeave = () => {
    if (isTouch.current || !ref.current) return
    ref.current.style.transition = 'transform 0.2s ease-out'
    ref.current.style.transform = 'perspective(400px) rotateX(0deg) rotateY(0deg)'
    setTimeout(() => { if (ref.current) ref.current.style.transition = '' }, 250)
  }
  if (isTouch.current) {
    return <div className={className} style={style}>{children}</div>
  }
  return <div ref={ref} onMouseEnter={onEnter} onMouseMove={onMove} onMouseLeave={onLeave} className={className} style={style}>{children}</div>
}

function PriceGrid({ items, filler, tabKey, onAdd }: { items: PriceItem[]; filler?: { label: string; desc: string }; tabKey: string; onAdd?: (item: PriceItem) => void }) {
  return (
    <div key={tabKey} className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 animate-fade-in">
      {items.map((item, i) => (
        <TiltCard
          key={`${item.priceUSD}-${i}`}
          className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-3 sm:p-4 flex flex-row items-center gap-x-2 animate-fade-in hover:bg-white/[0.06] hover:border-white/15 transition-all duration-200"
          style={{ animationDelay: `${i * 0.06}s` }}
        >
          <span className="text-[10px] xs:text-[11px] tracking-wider uppercase text-white/40 shrink-0 min-w-0 truncate">{item.label}</span>
          <div className="flex-1 text-center min-w-0">
            <div className="text-sm xs:text-base sm:text-lg font-bold text-white/90 tabular-nums leading-tight">${item.priceUSD}</div>
            <div className="text-[9px] xs:text-[10px] text-white/25">{item.priceRUB} ₽</div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onAdd?.(item) }}
            className="shrink-0 w-7 h-7 flex items-center justify-center bg-white/[0.06] hover:bg-white/20 transition-colors rounded"
            title="Добавить в корзину"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-white/50" />
          </button>
        </TiltCard>
      ))}
      {filler && (
        <div
          className="bg-white/[0.02] border border-dashed border-white/[0.08] rounded-lg p-3 sm:p-4 flex flex-row items-center justify-center gap-2 hover:bg-white/[0.05] hover:border-white/15 transition-all duration-300 animate-fade-in group"
          style={{ animationDelay: `${items.length * 0.06}s` }}
        >
          <span className="text-white/40 text-lg leading-none">+</span>
          <div>
            <div className="text-[11px] xs:text-xs font-medium text-white/40">{filler.label}</div>
            <div className="text-[10px] text-white/20">{filler.desc}</div>
          </div>
        </div>
      )}
    </div>
  )
}

function CursorTrail() {
  const dotsRef = useRef<HTMLDivElement[]>([])
  const pos = useRef({ x: 0, y: 0 })
  const raf = useRef(0)

  useEffect(() => {
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
  }, [])

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

const SLIDE_KEYS = ['home', 'catalog', 'how', 'payment', 'faq', 'discord']
const totalSlides = SLIDE_KEYS.length

function App() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [category, setCategory] = useState<CategoryTab>('decorations')
  const [nitroFilter, setNitroFilter] = useState<NitroTab>('with-nitro')
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [slide, setSlide] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [cart, setCart] = useState<PriceItem[]>([])

  const onAdd = (item: PriceItem) => setCart(prev => [...prev, item])

  const slideRef = useRef(0)
  const slideNodes = useRef<(HTMLDivElement | null)[]>([])
  const busyRef = useRef(false)

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
    if (replace) {
      window.history.replaceState(null, '', `#${key}`)
    } else {
      window.history.pushState(null, '', `#${key}`)
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
      const hash = window.location.hash.slice(1)
      const idx = SLIDE_KEYS.indexOf(hash)
      const start = idx >= 0 ? idx : 0
      slideRef.current = start
      slideNodes.current.forEach((el, i) => {
        if (!el) return
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
      if (hash !== SLIDE_KEYS[start]) {
        window.history.replaceState(null, '', `#${SLIDE_KEYS[start]}`)
      }
    }
    initPath()
    window.addEventListener('popstate', () => {
      const hash = window.location.hash.slice(1)
      const idx = SLIDE_KEYS.indexOf(hash)
      if (idx >= 0) goToSlide(idx, true)
    })
    const handlePop = () => {
      const hash = window.location.hash.slice(1)
      const idx = SLIDE_KEYS.indexOf(hash)
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

  const currentItems = category === 'decorations'
    ? (nitroFilter === 'with-nitro' ? decorationsWithNitro : decorationsNoNitro)
    : (nitroFilter === 'with-nitro' ? bundlesWithNitro : bundlesNoNitro)

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
      <CursorTrail />
      <div className="fixed inset-0 pointer-events-none -z-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundRepeat: 'repeat', backgroundSize: '200px 200px' }} />
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
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
            <button className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-white/[0.06] flex items-center justify-center hover:bg-white/15 transition-colors" title="Корзина">
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

      <div className="relative w-full h-full slide-viewport">
        {/* Slide 0: Hero */}
        <div
          ref={(el) => { slideNodes.current[0] = el }}
          className="flex slide-section absolute inset-0 items-center justify-center"
          style={{ zIndex: 0 }}
        >
          <SlideFade active={slide === 0} delay={100}>
            <div className="flex flex-col items-center justify-center h-full px-6 max-w-4xl mx-auto">
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04)_0%,transparent_60%)]" />
              <div className="animate-fade-in text-center" style={{ animationDelay: '0.1s' }}>
                <span className="inline-block text-[10px] tracking-[0.3em] uppercase text-white/30 bg-white/[0.04] px-5 py-2 rounded-full">Discord Ecosystem</span>
              </div>
              <div className="animate-fade-in mt-4 text-center" style={{ animationDelay: '0.2s' }}>
                <h1 className="text-4xl xs:text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight leading-none">
                  <span className="bg-gradient-to-r from-white via-gray-200 to-white/40 bg-clip-text text-transparent">Castello</span>
                </h1>
              </div>
              <div className="animate-fade-in mt-3 text-center" style={{ animationDelay: '0.35s' }}>
                <p className="text-white/40 text-base sm:text-lg max-w-xl leading-relaxed">
                  Кастомизация Discord: украшения и наборы для профиля. Без Nitro и с Nitro.
                </p>
              </div>
              <div className="animate-fade-in mt-6" style={{ animationDelay: '0.5s' }}>
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
              <div className="animate-fade-in mt-4 text-center" style={{ animationDelay: '0.6s' }}>
                <p className="text-white/20 text-xs">Заказ через бота — быстро и без лишних шагов</p>
              </div>
            </div>
          </SlideFade>
        </div>

        {/* Slide 1: Catalog */}
        <div
          ref={(el) => { slideNodes.current[1] = el }}
          className="slide-section absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 0 }}
        >
          <SlideFade active={slide === 1} delay={100} className="h-full w-full">
            <div className="overflow-y-auto h-full px-4 sm:px-6 max-w-5xl mx-auto flex flex-col justify-center items-center py-8">
              <SectionHeading label="Каталог" title="Цены на украшения и наборы" />

              <div className="flex justify-center gap-2 mb-4 flex-wrap">
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
                  { key: 'with-nitro' as const, label: 'С Nitro' },
                  { key: 'no-nitro' as const, label: 'Без Nitro' },
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
                key={`${category}-${nitroFilter}`}
                items={currentItems}
                filler={category === 'bundles' ? { label: 'Свой вариант', desc: 'Напиши в бот' } : undefined}
                tabKey={`${category}-${nitroFilter}`}
                onAdd={onAdd}
              />

              <div className="text-center mt-4 sm:mt-6 animate-fade-in shrink-0" style={{ animationDelay: '0.6s' }}>
                <a href="https://t.me/CastelloShop_bot" target="_blank" rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 px-4 xs:px-6 py-2 xs:py-3 bg-white/[0.04] border border-white/[0.08] text-white/60 font-medium rounded-xl hover:bg-white/[0.07] hover:border-white/15 hover:text-white/80 transition-all duration-200 text-xs xs:text-sm"
                >
                  Посмотреть все товары в боте
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
          className="slide-section absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 0 }}
        >
          <SlideFade active={slide === 2} delay={100} className="h-full w-full">
            <div className="overflow-y-auto h-full px-4 sm:px-6 max-w-4xl mx-auto flex flex-col items-center justify-center py-6">
              <SectionHeading label="Процесс" title="Как сделать заказ" />

              <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 mt-2 sm:mt-4 w-full max-w-3xl mx-auto">
                {/* Desktop connectors */}
                <div className="hidden sm:block absolute top-14 left-[calc(16.66%+1.5rem)] right-[calc(16.66%+1.5rem)] h-px">
                  <div className="w-full h-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent relative">
                    <div className="absolute left-1/4 top-0 w-2 h-2 -translate-y-1/2 rounded-full bg-white/[0.06]" />
                    <div className="absolute left-2/4 top-0 w-2 h-2 -translate-y-1/2 rounded-full bg-white/[0.06]" />
                    <div className="absolute left-3/4 top-0 w-2 h-2 -translate-y-1/2 rounded-full bg-white/[0.06]" />
                  </div>
                </div>
                {[
                  { step: '01', title: 'Открой бота', desc: 'Перейди в Telegram-бота Castello и нажми «Запустить».' },
                  { step: '02', title: 'Выбери товар', desc: 'Ознакомься с каталогом, выбери украшение или набор по цене.' },
                  { step: '03', title: 'Оплати и получи', desc: 'Оплати картой, СБП или криптой — товар придёт в течение 10–15 минут.' },
                ].map((item, i) => (
                  <div key={item.step} className="animate-fade-in" style={{ animationDelay: `${0.2 + i * 0.15}s` }}>
                    <div className="relative bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 sm:p-6 overflow-hidden text-center">
                      <div className="relative flex flex-col items-center">
                        <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center mb-3">
                          {i === 0 ? (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white/50" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                            </svg>
                          ) : i === 1 ? (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-[10px] sm:text-[11px] tracking-wider font-mono ${i === 0 ? 'text-sky-400/30' : i === 1 ? 'text-amber-400/30' : 'text-emerald-400/30'}`}>
                          {item.step}
                        </span>
                        <h3 className="text-sm sm:text-base font-semibold text-white/80 mt-1">{item.title}</h3>
                        <p className="text-white/40 text-xs sm:text-sm mt-1.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SlideFade>
        </div>

        {/* Slide 3: Payment */}
        <div
          ref={(el) => { slideNodes.current[3] = el }}
          className="slide-section absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 0 }}
        >
          <SlideFade active={slide === 3} delay={100}>
            <div className="overflow-y-auto h-full px-4 sm:px-6 max-w-2xl mx-auto flex flex-col items-center justify-center py-6">
              <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-white/30 bg-white/[0.04] px-4 py-1.5 rounded-full mb-3">
                <svg className="w-3 h-3 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                Безопасная оплата
              </span>

              <SectionHeading label="Оплата" title="Доступные способы" />

              {/* Credit Card Visual */}
              <div className="relative w-full max-w-xs mx-auto mb-6 sm:mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="relative aspect-[1.586/1] rounded-2xl bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-transparent border border-white/[0.08] p-5 sm:p-6 overflow-hidden">
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
              </div>

              {/* Payment Methods */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 w-full max-w-2xl mx-auto">
                {[
                  {
                    label: 'Банковские карты',
                    desc: 'Visa, Mastercard, МИР',
                    accent: 'from-blue-500/20 to-blue-600/5',
                    borderAccent: 'group-hover:border-blue-500/30',
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                    ),
                  },
                  {
                    label: 'СБП',
                    desc: 'Моментальный перевод',
                    accent: 'from-emerald-500/20 to-emerald-600/5',
                    borderAccent: 'group-hover:border-emerald-500/30',
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    ),
                  },
                  {
                    label: 'Криптовалюта',
                    desc: 'TON, USDT (TON / TRC-20), Solana',
                    accent: 'from-violet-500/20 to-violet-600/5',
                    borderAccent: 'group-hover:border-violet-500/30',
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ),
                  },
                ].map((method, i) => (
                  <div key={method.label}
                    className={`group relative flex sm:flex-col items-center sm:text-center gap-3 sm:gap-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3 sm:p-4 sm:pt-6 ${method.borderAccent} hover:bg-white/[0.06] transition-all duration-300 animate-fade-in overflow-hidden`}
                    style={{ animationDelay: `${0.2 + i * 0.1}s` }}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${method.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    <div className="relative shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.06] border border-white/[0.06] flex items-center justify-center group-hover:scale-110 group-hover:border-white/20 transition-all duration-300">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white/50 group-hover:text-white/70 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        {method.icon}
                      </svg>
                    </div>
                    <div className="relative">
                      <div className="text-sm sm:text-base font-semibold text-white/80 group-hover:text-white transition-colors">{method.label}</div>
                      <p className="text-white/30 text-xs sm:text-sm mt-0.5 group-hover:text-white/40 transition-colors">{method.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SlideFade>
        </div>

        {/* Slide 4: FAQ */}
        <div
          ref={(el) => { slideNodes.current[4] = el }}
          className="slide-section absolute inset-0 flex items-center justify-center"
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
          className="slide-section absolute inset-0 flex items-center justify-center mt-30"
          style={{ zIndex: 0 }}
        >
          <SlideFade active={slide === 5} delay={100}>
            <div className="overflow-y-auto h-full px-4 sm:px-6 max-w-3xl mx-auto flex flex-col items-center justify-center py-6">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl sm:rounded-3xl p-5 sm:p-10 text-center hover:bg-white/[0.03] transition-colors">
                <span className="inline-block text-[10px] tracking-[0.25em] uppercase text-white/30 bg-white/[0.04] px-4 py-1.5 rounded-full mb-3">Сообщество</span>
                <h2 className="text-2xl sm:text-3xl font-bold mt-2">Присоединяйся к Discord</h2>
                <p className="text-white/40 text-sm sm:text-base mt-2 max-w-lg mx-auto leading-relaxed">
                  Общайся с другими пользователями, получай новости и участвуй в закрытых распродажах.
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
                <h2 className="text-2xl sm:text-3xl font-bold">Готов начать?</h2>
                <p className="text-white/40 text-sm sm:text-base mt-2">Жми кнопку и выбирай то, что подходит именно тебе.</p>
                <a href="https://t.me/CastelloShop_bot" target="_blank" rel="noopener noreferrer"
                  className="group relative inline-flex items-center gap-3 px-8 py-3 sm:py-4 bg-white text-[#070708] font-semibold text-sm sm:text-base rounded-2xl transition-all duration-300 hover:bg-gray-100 hover:scale-[1.03] active:scale-95 mt-4"
                >
                  <span className="absolute -inset-1 rounded-2xl bg-white/15 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="relative flex items-center gap-3">
                    <svg className="w-5 h-5 transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:scale-110 group-hover:rotate-[20deg]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                    Перейти в Telegram-бот
                  </span>
                </a>
              </div>

              <footer className="flex flex-col items-center text-center mt-30 border-t border-white/[0.04] pt-3 sm:pt-4 animate-fade-in" style={{ animationDelay: '2s' }}>
                <p className="mb-2 text-white/20 text-[10px] sm:text-xs">Castello Ecosystem &copy; {new Date().getFullYear()}</p>
                <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl px-4 py-3 inline-block">
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
