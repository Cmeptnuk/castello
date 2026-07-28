import { useState, useEffect, useRef } from 'react'
import Lenis from 'lenis'

function useCountUp(target: number, duration: number, trigger: boolean) {
  const [count, setCount] = useState(0)
  const started = useRef(false)
  useEffect(() => {
    if (!trigger || started.current) return
    started.current = true
    let start: number | null = null
    const step = (now: number) => {
      if (!start) start = now
      const p = Math.min((now - start) / duration, 1)
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [trigger, target, duration])
  return count
}

function SectionObserver({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); o.disconnect() } }, { threshold: 0.15 })
    o.observe(el)
    return () => o.disconnect()
  }, [])
  return (
    <div ref={ref} className={`transition-opacity duration-700 ease-out ${v ? 'opacity-100' : 'opacity-0'} ${className || ''}`}>
      {children}
    </div>
  )
}

function SectionHeading({ label, title }: { label: string; title: string }) {
  return (
    <div className="text-center">
      <span className="inline-block text-[10px] tracking-[0.25em] uppercase text-white/30 bg-white/[0.04] px-4 py-1.5 rounded-full mb-4">{label}</span>
      <h2 className="text-3xl sm:text-4xl font-bold">{title}</h2>
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

function PriceGrid({ items, filler, tabKey }: { items: PriceItem[]; filler?: { label: string; desc: string }; tabKey: string }) {
  return (
    <div key={tabKey} className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in">
      {items.map((item, i) => (
        <TiltCard
          key={`${item.priceUSD}-${i}`}
          className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between sm:flex-col sm:text-center gap-x-4 gap-y-2 animate-fade-in group cursor-pointer hover:bg-white/[0.06] hover:border-white/15 transition-all duration-200 ease-out will-change-transform"
          style={{ animationDelay: `${i * 0.06}s` }}
        >
          <a href="https://t.me/CastelloShop_bot" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between sm:flex-col sm:text-center gap-x-4 gap-y-2 w-full">
            <span className="text-sm text-white/60 font-medium group-hover:text-white/80 transition-colors">{item.label}</span>
            <div className="text-right sm:text-center">
              <div className="text-lg font-bold text-white/90">${item.priceUSD}</div>
              <div className="text-xs text-white/30">{item.priceRUB} ₽</div>
            </div>
          </a>
        </TiltCard>
      ))}
      {filler && (
        <a
          href="https://t.me/CastelloShop_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/[0.02] border border-dashed border-white/[0.08] rounded-xl p-4 flex flex-col items-center justify-center gap-1 hover:bg-white/[0.05] hover:border-white/15 transition-all duration-300 animate-fade-in group cursor-pointer"
          style={{ animationDelay: `${items.length * 0.06}s` }}
        >
          <span className="text-sm font-medium text-white/40 group-hover:text-white/60 transition-colors">{filler.label}</span>
          <span className="text-xs text-white/20">{filler.desc}</span>
        </a>
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

function App() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [category, setCategory] = useState<CategoryTab>('decorations')
  const [nitroFilter, setNitroFilter] = useState<NitroTab>('with-nitro')
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const statsRef = useRef<HTMLDivElement>(null)
  const [statsVisible, setStatsVisible] = useState(false)
  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStatsVisible(true); o.disconnect() } }, { threshold: 0.3 })
    o.observe(el)
    return () => o.disconnect()
  }, [])

  const orders = useCountUp(156, 2000, statsVisible)
  const clients = useCountUp(89, 2000, statsVisible)
  const products = useCountUp(30, 2000, statsVisible)

  useEffect(() => {
    const isTouch = 'ontouchstart' in window
    const lenis = new Lenis({
      duration: isTouch ? 0.5 : 1.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 0.8,
      touchMultiplier: isTouch ? 0.8 : 1.2,
      lerp: isTouch ? 0.15 : 0.08,
      syncTouch: isTouch,
    })
    const raf = (t: number) => { lenis.raf(t); requestAnimationFrame(raf) }
    requestAnimationFrame(raf)
    return () => lenis.destroy()
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

  return (
    <div className="bg-[#070708] text-white relative overflow-hidden" onMouseMove={onMouseMove}>
      <CursorTrail />
      {/* Noise overlay */}
      <div className="fixed inset-0 pointer-events-none -z-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundRepeat: 'repeat', backgroundSize: '200px 200px' }} />

      {/* Parallax orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/[0.015] rounded-full blur-[120px] transition-transform duration-700 ease-out" style={{ transform: `translate(${mousePos.x * 30}px, ${mousePos.y * 30}px)` }} />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-white/[0.01] rounded-full blur-[150px] transition-transform duration-900 ease-out" style={{ transform: `translate(${mousePos.x * -25}px, ${mousePos.y * -25}px)` }} />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-white/[0.008] rounded-full blur-[100px] transition-transform duration-600 ease-out" style={{ transform: `translate(${mousePos.x * 20}px, ${mousePos.y * -20}px)` }} />
      </div>

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-svh px-6 py-24 max-w-4xl mx-auto text-center">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04)_0%,transparent_60%)]" />

        <p className="text-[10px] tracking-[0.3em] uppercase text-white/30 animate-fade-in bg-white/[0.04] px-5 py-2 rounded-full" style={{ animationDelay: '0.1s' }}>
          Discord Ecosystem
        </p>

        <h1 className="text-6xl sm:text-8xl md:text-9xl font-bold tracking-tight mt-6 leading-none break-words animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <span className="bg-gradient-to-r from-white via-gray-200 to-white/40 bg-clip-text text-transparent">
            Castello
          </span>
        </h1>

        <p className="text-white/40 text-lg sm:text-xl mt-6 max-w-xl animate-fade-in leading-relaxed" style={{ animationDelay: '0.35s' }}>
          Кастомизация Discord: украшения и наборы для профиля. Без Nitro и с Nitro.
        </p>

        <a href="https://t.me/CastelloShop_bot" target="_blank" rel="noopener noreferrer"
          className="group relative inline-flex items-center gap-3 px-10 py-5 bg-white text-[#070708] font-semibold text-lg rounded-2xl transition-all duration-300 hover:bg-gray-100 hover:scale-[1.03] active:scale-95 mt-10 animate-fade-in"
          style={{ animationDelay: '0.5s' }}>
          <span className="absolute -inset-1 rounded-2xl bg-white/15 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100" />
          <span className="relative flex items-center gap-3">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            Перейти в Telegram-бот
          </span>
        </a>

        <p className="text-white/20 text-sm mt-6 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          Заказ через бота — быстро и без лишних шагов
        </p>
      </div>

      {/* Divider */}
      <div className="relative z-10 mx-auto w-px h-20 bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />

      {/* Stats */}
      <section ref={statsRef} className="relative z-10 px-6 py-16 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
          {[
            { value: orders, label: 'Выполненных заказов', suffix: '+' },
            { value: clients, label: 'Довольных клиентов', suffix: '+' },
            { value: products, label: 'Товаров в каталоге', suffix: '+' },
          ].map((s, i) => (
            <div key={s.label} className="animate-fade-in" style={{ animationDelay: `${i * 0.12}s` }}>
              <div className="text-5xl sm:text-6xl font-bold text-white/90">{s.value}{s.suffix}</div>
              <p className="text-white/30 text-sm mt-2 tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Catalog */}
      <section className="relative z-10 px-6 py-24 max-w-5xl mx-auto">
        <SectionObserver>
          <SectionHeading label="Каталог" title="Цены на украшения и наборы" />
        </SectionObserver>

        <div className="mt-12">
          <div className="flex justify-center gap-2 mb-6 flex-wrap">
            {[
              { key: 'decorations' as const, label: 'Украшения' },
              { key: 'bundles' as const, label: 'Наборы' },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setCategory(tab.key)}
                className={`px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  category === tab.key
                    ? 'bg-white text-[#070708] shadow-lg shadow-white/10'
                    : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex justify-center gap-2 mb-10 flex-wrap">
            {[
              { key: 'with-nitro' as const, label: 'С Nitro' },
              { key: 'no-nitro' as const, label: 'Без Nitro' },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setNitroFilter(tab.key)}
                className={`px-5 py-2 rounded-lg text-xs font-medium tracking-wider transition-all duration-200 ${
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
          />
        </div>

        <div className="text-center mt-10 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <a href="https://t.me/CastelloShop_bot" target="_blank" rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 px-6 py-3 bg-white/[0.04] border border-white/[0.08] text-white/60 font-medium rounded-xl hover:bg-white/[0.07] hover:border-white/15 hover:text-white/80 transition-all duration-200 text-sm"
          >
            Посмотреть все товары в боте
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>
      </section>

      {/* Divider */}
      <div className="relative z-10 mx-auto w-px h-16 bg-gradient-to-b from-transparent via-white/[0.04] to-transparent" />

      {/* How it works */}
      <section className="relative z-10 px-6 py-24 max-w-3xl mx-auto text-center">
        <SectionObserver>
          <SectionHeading label="Процесс" title="Как сделать заказ" />
        </SectionObserver>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mt-14">
          {[
            { step: '01', title: 'Открой бота', desc: 'Перейди в Telegram-бота Castello и нажми «Запустить» / Start.' },
            { step: '02', title: 'Выбери товар', desc: 'Ознакомься с каталогом, выбери украшение или набор по цене.' },
            { step: '03', title: 'Оплати и получи', desc: 'Оплати картой, СБП или криптой (TON, USDT, Solana) — товар придёт в течение 10–15 минут.' },
          ].map((item, i) => (
            <div key={item.step} className="animate-fade-in" style={{ animationDelay: `${0.2 + i * 0.12}s` }}>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-white/20 text-2xl font-bold mb-5">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold text-white/90">{item.title}</h3>
              <p className="text-white/40 text-sm mt-2 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="relative z-10 mx-auto w-px h-16 bg-gradient-to-b from-transparent via-white/[0.04] to-transparent" />

      {/* Payment */}
      <section className="relative z-10 px-6 py-24 max-w-3xl mx-auto text-center">
        <SectionObserver>
          <SectionHeading label="Оплата" title="Доступные способы" />
        </SectionObserver>

        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4 mt-12 max-w-2xl mx-auto">
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
            <div key={method.label}
              className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300 animate-fade-in text-left"
              style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                  {method.icon}
                </svg>
              </div>
              <div className="text-base font-semibold text-white/90">{method.label}</div>
              <p className="text-white/30 text-sm mt-1">{method.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="relative z-10 mx-auto w-px h-16 bg-gradient-to-b from-transparent via-white/[0.04] to-transparent" />

      {/* FAQ */}
      <section className="relative z-10 px-6 py-24 max-w-2xl mx-auto">
        <SectionObserver>
          <SectionHeading label="FAQ" title="Частые вопросы" />
        </SectionObserver>

        <div className="w-full mt-12">
          {faqData.map((item, i) => (
            <FaqItem key={item.q} q={item.q} a={item.a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="relative z-10 mx-auto w-px h-16 bg-gradient-to-b from-transparent via-white/[0.04] to-transparent" />

      {/* Discord */}
      <section className="relative z-10 px-6 py-24 max-w-3xl mx-auto text-center">
        <SectionObserver>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-10 sm:p-16 hover:bg-white/[0.03] transition-colors">
            <span className="inline-block text-[10px] tracking-[0.25em] uppercase text-white/30 bg-white/[0.04] px-4 py-1.5 rounded-full mb-4">Сообщество</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3">Присоединяйся к Discord</h2>
            <p className="text-white/40 text-lg mt-4 max-w-lg mx-auto leading-relaxed">
              Общайся с другими пользователями, получай новости и участвуй в закрытых распродажах.
            </p>
            <a href="https://discord.gg/uA4vu9CXHE" target="_blank" rel="noopener noreferrer"
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[#5865F2] text-white font-semibold text-lg rounded-2xl transition-all duration-300 hover:bg-[#4752c4] hover:scale-[1.03] active:scale-95 mt-8">
              <span className="absolute -inset-1 rounded-2xl bg-[#5865F2]/20 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative flex items-center gap-3">
                <svg className="w-6 h-6" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612" />
                </svg>
              </span>
            </a>
          </div>
        </SectionObserver>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_60%)]" />
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 pb-24 max-w-3xl mx-auto text-center">
        <SectionObserver>
          <h2 className="text-4xl sm:text-5xl font-bold">Готов начать?</h2>
          <p className="text-white/40 text-lg mt-4">Жми кнопку и выбирай то, что подходит именно тебе.</p>
        </SectionObserver>

        <a href="https://t.me/CastelloShop_bot" target="_blank" rel="noopener noreferrer"
          className="group relative inline-flex items-center gap-3 px-10 py-5 bg-white text-[#070708] font-semibold text-lg rounded-2xl transition-all duration-300 hover:bg-gray-100 hover:scale-[1.03] active:scale-95 mt-10"
        >
          <span className="absolute -inset-1 rounded-2xl bg-white/15 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100" />
          <span className="relative flex items-center gap-3">
            <svg className="w-6 h-6 transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:scale-110 group-hover:rotate-[20deg]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            Перейти в Telegram-бот
          </span>
        </a>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 max-w-3xl mx-auto text-center border-t border-white/[0.04] animate-fade-in" style={{ animationDelay: '2s' }}>
        <p className="mb-4 text-white/20 text-xs">Castello Ecosystem &copy; {new Date().getFullYear()}</p>
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl px-5 py-4 inline-block">
          <p className="text-white/60 text-sm font-medium mb-1">Индивидуальный предприниматель Бережной Егор Станиславович</p>
          <p className="text-white/30 text-xs">ИНН 910824288444 &nbsp;|&nbsp; ОГРНИП 325911200146721</p>
        </div>
      </footer>
    </div>
  )
}

export default App
