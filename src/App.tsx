import { Fragment, useState, useEffect, useRef, useSyncExternalStore } from 'react'
import { ShoppingCart, Menu, UserRound, X } from 'lucide-react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'
import { SLIDE_KEYS, slideFromPath } from './slides.ts'
import { subscribeCart, readCart, writeCart, serverCart } from './cart.ts'
import {
  decorationsNoNitro, decorationsWithNitro, bundlesNoNitro, bundlesWithNitro,
  faqData, steps, navItems, catalogCopy, TELEGRAM_URL, DISCORD_URL,
  type PriceItem, type CategoryTab, type NitroTab,
} from './data.ts'
import { PageChrome } from './components/PageChrome.tsx'
import { PriceGrid } from './components/PriceGrid.tsx'
import { ProductDialog } from './components/ProductDialog.tsx'
import { AuthDialog } from './components/AuthDialog.tsx'
import { FaqItem } from './components/FaqItem.tsx'
import { CursorTrail } from './components/CursorTrail.tsx'
import { SlideFade, SectionHeading, GlassPanel } from './components/ui.tsx'
import { TelegramIcon, DiscordIcon, StepIcon, ShieldCheckIcon, ArrowRightIcon, CardIcon, CoinIcon, SbpIcon } from './components/icons.tsx'
import { readProfile, type Profile } from './auth.ts'

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

const facts = [
  { value: '10–15 мин', label: 'выдача после оплаты' },
  { value: 'Карты РФ, СБП', label: 'и криптовалюта' },
  { value: 'С Nitro и без', label: 'отдельные категории' },
]

/* У СБП свой знак и свои цвета, поэтому строка помечена как `mark`: такой
   значок не перекрашивается вслед за состоянием строки и не садится на
   индиговую плитку — иначе марку перестанут узнавать. */
const paymentMethods = [
  { label: 'Банковские карты', desc: 'Visa, Mastercard, МИР', Icon: CardIcon, mark: false },
  { label: 'СБП', desc: 'Система быстрых платежей, моментальный перевод', Icon: SbpIcon, mark: true },
  { label: 'Криптовалюта', desc: 'TON, USDT (TON / TRC-20), Solana', Icon: CoinIcon, mark: false },
]

/* Процесс делится ровно посередине: три шага делает покупатель, три —
   продавец. Раскладка слайда строится на этой границе, поэтому дорожки
   считаем из данных, а не из номеров шагов. */
const indexedSteps = steps.map((step, icon) => ({ ...step, icon }))
const processTracks = [
  { key: 'you' as const, label: 'Ваша сторона', items: indexedSteps.filter((s) => s.actor === 'you') },
  { key: 'us' as const, label: 'Наша сторона', items: indexedSteps.filter((s) => s.actor === 'us') },
]

const totalSlides = SLIDE_KEYS.length
const motionDuration = (ms: number) => (
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? Math.min(ms, 480)
    : ms
)
/* Поля слайда держат содержимое в стороне от шасси: сверху — панель навигации,
   снизу — пагинация, по бокам — вертикальные подписи и углы. */
const SLIDE_BOX = 'h-full overflow-y-auto px-10 sm:px-16 lg:px-24 pt-14 sm:pt-20 pb-16 sm:pb-20 flex flex-col items-center justify-center'

function App({ initialSlide = 0 }: { initialSlide?: number }) {
  // Стартовый слайд виден с первого кадра, а не после монтирования: иначе весь
  // первый экран красится прозрачным и Chrome не находит кандидата на LCP.
  const [initialPaint, setInitialPaint] = useState(true)
  const initialClass = (i: number) => (initialPaint && i === initialSlide ? ' slide-initial' : '')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [category, setCategory] = useState<CategoryTab>('decorations')
  const [nitroFilter, setNitroFilter] = useState<NitroTab>('no-nitro')
  const [slide, setSlide] = useState(initialSlide)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuClosing, setMenuClosing] = useState(false)
  const cart = useSyncExternalStore(subscribeCart, readCart, serverCart)
  const [cartOpen, setCartOpen] = useState(false)
  const [cartClosing, setCartClosing] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [detail, setDetail] = useState<PriceItem | null>(null)
  /* Стрелки листают слайды из обработчика, повешенного один раз на window, —
     открытые поверх сайта инструменты поэтому отражаются в ref отдельно. */
  const overlayRef = useRef(false)
  useEffect(() => {
    overlayRef.current = Boolean(detail || profileOpen || cartOpen || menuOpen)
  }, [detail, profileOpen, cartOpen, menuOpen])
  const [toast, setToast] = useState('')
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const cartTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const menuTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    readProfile(controller.signal)
      .then(setProfile)
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setProfile(null)
      })
    return () => controller.abort()
  }, [])

  const onAdd = (item: PriceItem) => {
    writeCart([...cart, item])
    setToast('Товар добавлен в корзину')
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2000)
  }
  const removeFromCart = (index: number) => writeCart(cart.filter((_, i) => i !== index))

  const openCart = () => {
    clearTimeout(cartTimer.current)
    setCartClosing(false)
    setCartOpen(true)
  }

  const closeCart = (afterClose?: () => void) => {
    if (!cartOpen || cartClosing) return
    setCartClosing(true)
    clearTimeout(cartTimer.current)
    cartTimer.current = setTimeout(() => {
      setCartOpen(false)
      setCartClosing(false)
      afterClose?.()
    }, motionDuration(580))
  }

  const openMenu = () => {
    clearTimeout(menuTimer.current)
    setMenuClosing(false)
    setMenuOpen(true)
  }

  const closeMenu = (afterClose?: () => void) => {
    if (!menuOpen || menuClosing) return
    setMenuClosing(true)
    clearTimeout(menuTimer.current)
    menuTimer.current = setTimeout(() => {
      setMenuOpen(false)
      setMenuClosing(false)
      afterClose?.()
    }, motionDuration(440))
  }

  useEffect(() => () => {
    clearTimeout(toastTimer.current)
    clearTimeout(cartTimer.current)
    clearTimeout(menuTimer.current)
  }, [])

  const slideRef = useRef(initialSlide)
  const slideNodes = useRef<(HTMLDivElement | null)[]>([])
  const busyRef = useRef(false)
  const prevSlide = useRef(slide)
  const [slideTransition, setSlideTransition] = useState<{ from: number; to: number; direction: 'forward' | 'backward' } | null>(null)
  const [paymentSeq, setPaymentSeq] = useState(0)

  useEffect(() => {
    if (slide === 3 && prevSlide.current !== 3) setPaymentSeq(s => s + 1)
    prevSlide.current = slide
  }, [slide])

  /* Позиция курсора уезжает в CSS-переменные на корне. Раньше она лежала в
     состоянии, и каждое движение мыши перерисовывало приложение целиком
     вместе с сеткой карточек — при том что читают её только параллакс пятен,
     то есть исключительно CSS.

     На каталоге параллакс выключен совсем. Пятна лежат под панелью, а панель
     несёт backdrop-filter: сдвиг пятна — это не композиция, а повод пересчитать
     блюр по всей её площади, 1150×650 на каждое движение мыши. Это самая
     большая стеклянная поверхность сайта, и лаги при входе в категорию шли
     именно отсюда. Само пятно за панелью всё равно не видно — видно только,
     во что оно красит стекло, а это от сдвига на 30 пикселей не меняется. */
  useEffect(() => {
    const root = rootRef.current
    if (!root || slide === 1) return
    let raf = 0
    let x = 0
    let y = 0
    const onMove = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        root.style.setProperty('--mx', String((x / window.innerWidth - 0.5) * 2))
        root.style.setProperty('--my', String((y / window.innerHeight - 0.5) * 2))
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [slide])

  const goToSlide = (i: number, replace = false) => {
    const idx = Math.max(0, Math.min(i, totalSlides - 1))
    if (idx === slideRef.current || busyRef.current) return
    const prev = slideRef.current
    const entering = slideNodes.current[idx]
    const leaving = slideNodes.current[prev]
    if (!entering || !leaving) return
    const direction = idx > prev ? 'forward' : 'backward'
    busyRef.current = true
    slideRef.current = idx
    entering.style.zIndex = '20'
    leaving.style.zIndex = '10'
    entering.style.visibility = 'visible'
    entering.style.pointerEvents = 'auto'
    leaving.style.pointerEvents = 'none'
    // Состояние, а не ручной classList: React иначе синхронизирует className
    // после setSlide и мгновенно стирает imperative-класс перехода в Firefox.
    setSlideTransition({ from: prev, to: idx, direction })
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
      setSlideTransition(null)
      entering.style.zIndex = ''
      leaving.style.zIndex = ''
      leaving.style.visibility = 'hidden'
      leaving.style.pointerEvents = 'none'
      entering.style.visibility = ''
      entering.style.pointerEvents = ''
    }
    setTimeout(cleanup, motionDuration(1100))
  }

  const wheelLockRef = useRef(false)
  const handleWheel = (e: React.WheelEvent) => {
    if (busyRef.current || wheelLockRef.current || overlayRef.current) return
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
        // После первого клиентского кадра видимостью управляют is-active и
        // React-состояние перехода, поэтому SSR-класс больше не нужен.
        el.classList.remove('slide-initial')
        if (i === start) {
          el.style.zIndex = ''
          el.style.visibility = 'visible'
          el.style.pointerEvents = 'auto'
        } else {
          el.style.visibility = 'hidden'
          el.style.pointerEvents = 'none'
        }
      })
      setSlide(start)
      setSlideTransition(null)
      setInitialPaint(false)
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
      if (overlayRef.current) return
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

  const currentItems =
    category === 'decorations'
      ? (nitroFilter === 'no-nitro' ? decorationsNoNitro : decorationsWithNitro)
      : (nitroFilter === 'no-nitro' ? bundlesNoNitro : bundlesWithNitro)

  const slideMotionClass = (i: number) => {
    if (!slideTransition) return ''
    if (slideTransition.to === i) return ` slide-enter-${slideTransition.direction}`
    if (slideTransition.from === i) return ` slide-exit-${slideTransition.direction}`
    return ''
  }

  return (
    <div ref={rootRef} className="app-shell bg-[#070708] text-white h-svh overflow-hidden" onWheel={handleWheel}>
      {/* Пути берутся из Resilient Intake, если Vercel их выдал на сборке —
          иначе пакеты сами подставят штатные /_vercel/*. */}
      <SpeedInsights {...observability.speedInsights} />
      <Analytics {...observability.analytics} />
      <CursorTrail />

      <div aria-hidden className="noise fixed inset-0 pointer-events-none -z-0 opacity-[0.03]" />

      {/* Индиго живёт здесь и больше нигде: панели забирают его через
          backdrop-filter, поэтому окрашиваются неравномерно — по тому, что
          именно оказалось под ними. */}
      <div aria-hidden className="decor-orbs fixed inset-0 pointer-events-none overflow-hidden -z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] transition-transform duration-700 ease-out"
          style={{ background: 'rgba(88,101,242,0.10)', transform: 'translate(calc(var(--mx) * 30px), calc(var(--my) * 30px))' }} />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full blur-[150px] transition-transform duration-700 ease-out"
          style={{ background: 'rgba(88,101,242,0.07)', transform: 'translate(calc(var(--mx) * -25px), calc(var(--my) * -25px))' }} />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 rounded-full blur-[100px] transition-transform duration-700 ease-out"
          style={{ background: 'rgba(255,255,255,0.012)', transform: 'translate(calc(var(--mx) * 20px), calc(var(--my) * -20px))' }} />
      </div>

      <PageChrome slide={slide} onSelect={goToSlide} />

      <nav className="chrome-enter fixed top-(--chrome-pad) left-0 right-0 z-40 flex items-center justify-between gap-2 px-11 sm:px-16">
        <button
          onClick={() => menuOpen ? closeMenu() : openMenu()}
          className="glass glass-blur rounded-xl w-9 h-9 flex items-center justify-center sm:hidden transition-[background-color] hover:bg-white/[0.09]"
          aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="w-5 h-5 text-white/60" /> : <Menu className="w-5 h-5 text-white/60" />}
        </button>

        <div className="glass glass-blur rounded-2xl hidden sm:flex items-center gap-1 p-1">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => goToSlide(SLIDE_KEYS.indexOf(item.key))}
              aria-current={SLIDE_KEYS[slide] === item.key ? 'page' : undefined}
              className={`px-3 lg:px-4 py-1.5 rounded-xl text-xs lg:text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                SLIDE_KEYS[slide] === item.key
                  ? 'bg-white/10 text-white'
                  : 'text-white/35 hover:text-white/70'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Кнопки собраны в одну стеклянную планку, а не размыты по отдельности:
            каждый backdrop-filter — свой проход по фону под ним. */}
        <div className="glass glass-blur rounded-2xl flex items-center gap-1 p-1 shrink-0">
          <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
            className="rounded-xl w-8 h-8 flex items-center justify-center transition-colors hover:bg-white/[0.08]"
            aria-label="Telegram-бот">
            <TelegramIcon className="w-4.5 h-4.5 text-white/60" />
          </a>
          <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer"
            className="rounded-xl w-8 h-8 flex items-center justify-center transition-colors hover:bg-white/[0.08]"
            aria-label="Discord-сервер">
            <DiscordIcon className="w-4.5 h-4.5 text-white/60" />
          </a>
          <div className="relative">
            <button
              onClick={() => setProfileOpen(true)}
              className="rounded-xl w-8 h-8 flex items-center justify-center transition-colors hover:bg-white/[0.08]"
              aria-label={profile ? `Профиль: ${profile.displayName}` : 'Войти или зарегистрироваться'}
              aria-haspopup="dialog"
              title="Профиль"
            >
              <UserRound className={`w-4.5 h-4.5 transition-colors ${profile ? 'text-white/85' : 'text-white/60'}`} />
            </button>
            {profile && (
              <span aria-hidden className="profile-status absolute right-0.5 bottom-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-[#111114]" />
            )}
          </div>
          <div className="relative">
            <button onClick={openCart}
              className="rounded-xl w-8 h-8 flex items-center justify-center transition-colors hover:bg-white/[0.08]"
              aria-label={`Корзина, товаров: ${cart.length}`}>
              <ShoppingCart className="w-4.5 h-4.5 text-white/60" />
            </button>
            {cart.length > 0 && (
              <span key={cart.length} className="cart-count absolute -top-0.5 -right-0.5 w-4 h-4 rounded-[3px] bg-white text-[#070708] text-[9px] font-bold flex items-center justify-center pointer-events-none">
                {cart.length}
              </span>
            )}
          </div>
        </div>
      </nav>

      {cartOpen && (
        <div className={`overlay-shell fixed inset-0 z-50 flex justify-end ${cartClosing ? 'is-exiting' : ''}`}>
          <div className="overlay-backdrop absolute inset-0 bg-black/60" onClick={() => closeCart()} />
          <div className="cart-drawer glass glass-blur relative w-full max-w-sm h-full flex flex-col rounded-none">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <span className="text-sm font-medium text-white/80">Корзина ({cart.length})</span>
              <button onClick={() => closeCart()} className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center hover:bg-white/15 transition-colors" aria-label="Закрыть корзину">
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>
            {cart.length === 0 ? (
              <div className="cart-empty flex-1 flex flex-col items-center justify-center text-white/30 text-sm gap-3">
                <ShoppingCart className="w-10 h-10 text-white/20" />
                <span>Пока пусто</span>
                <button onClick={() => closeCart(() => goToSlide(1))} className="text-white/50 hover:text-white/80 underline underline-offset-4 transition-colors">
                  Открыть каталог
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
                  {cart.map((item, i) => (
                    <div key={`${item.label}-${item.priceRUB}-${i}`} className="cart-item glass rounded-xl flex items-center justify-between px-4 py-3" style={{ animationDelay: `${0.08 + i * 0.055}s` }}>
                      <div>
                        <div className="text-sm font-medium text-white/80">{item.label}</div>
                        <div className="text-xs text-white/40">{item.priceRUB} ₽</div>
                      </div>
                      <button onClick={() => removeFromCart(i)} className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center hover:bg-white/15 transition-colors shrink-0 ml-3" aria-label={`Убрать ${item.label} за ${item.priceRUB} ₽`}>
                        <X className="w-3.5 h-3.5 text-white/50" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="cart-footer border-t border-white/[0.06] px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Итого</span>
                    <span className="font-semibold text-white">
                      {cart.reduce((s, i) => s + i.priceRUB, 0).toFixed(2)} ₽
                    </span>
                  </div>
                  <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-white text-[#070708] font-semibold text-sm rounded-xl hover:bg-gray-100 transition-colors">
                    <TelegramIcon className="w-4 h-4" />
                    Оформить в боте
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {detail && (
        <ProductDialog
          item={detail}
          copy={catalogCopy[category][nitroFilter]}
          telegramUrl={TELEGRAM_URL}
          onAdd={onAdd}
          onClose={() => setDetail(null)}
        />
      )}

      {profileOpen && (
        <AuthDialog
          profile={profile}
          onProfileChange={setProfile}
          onClose={() => setProfileOpen(false)}
        />
      )}

      {menuOpen && (
        <div className={`mobile-menu fixed inset-0 z-30 sm:hidden bg-[#070708]/90 glass-blur flex flex-col items-center justify-center gap-4 ${menuClosing ? 'is-exiting' : ''}`}>
          {navItems.map((item, i) => (
            <button
              key={item.key}
              onClick={() => closeMenu(() => goToSlide(SLIDE_KEYS.indexOf(item.key)))}
              className={`mobile-menu-item text-lg font-medium transition-colors ${
                SLIDE_KEYS[slide] === item.key ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
              style={{ animationDelay: `${0.06 + i * 0.045}s` }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {toast && (
        <div className="toast-motion fixed bottom-20 left-1/2 -translate-x-1/2 z-50" role="status">
          <div className="glass glass-blur glass-strong rounded-xl text-white/90 text-sm px-5 py-2.5">
            {toast}
          </div>
        </div>
      )}

      <div className="relative w-full h-full slide-viewport">
        {/* Slide 0: Hero */}
        <div
          ref={(el) => { slideNodes.current[0] = el }}
          className={`flex slide-section absolute inset-0 items-center justify-center${initialClass(0)}${slide === 0 ? ' is-active' : ''}${slideMotionClass(0)}`}
          style={{ zIndex: 0 }}
        >
          <SlideFade active={slide === 0} delay={100} className="h-full w-full">
            <div className={SLIDE_BOX}>
              <div className="animate-rise-in" style={{ animationDelay: '0.1s' }}>
                <span className="glass rounded-full inline-block text-[10px] tracking-[0.3em] uppercase text-white/30 px-5 py-2">Castello Shop</span>
              </div>
              <h1 className="animate-rise-in mt-4 text-4xl xs:text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight leading-none text-center" style={{ animationDelay: '0.2s' }}>
                <span className="bg-gradient-to-r from-white via-gray-200 to-white/40 bg-clip-text text-transparent">Castello</span>
              </h1>
              <p className="animate-rise-in mt-3 text-white/40 text-base sm:text-lg max-w-xl leading-relaxed text-center" style={{ animationDelay: '0.35s' }}>
                Кастомизация Discord: украшения и наборы для профиля. Без Nitro и с Nitro.
              </p>
              <div className="animate-rise-in mt-6" style={{ animationDelay: '0.5s' }}>
                <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
                  className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-[#070708] font-semibold text-base rounded-2xl transition-all duration-300 hover:bg-gray-100 hover:scale-[1.03] active:scale-95"
                >
                  <span className="absolute -inset-1 rounded-2xl bg-white/15 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="relative flex items-center gap-3">
                    <TelegramIcon className="w-5 h-5" />
                    Перейти в Telegram-бот
                  </span>
                </a>
              </div>

              {/* Три факта, которые иначе пришлось бы искать в FAQ: срок
                  выдачи, способы оплаты, деление на категории. */}
              <div className="glass glass-blur rounded-2xl mt-8 sm:mt-10 w-full max-w-2xl grid grid-cols-3 animate-glass-settle" style={{ animationDelay: '0.65s' }}>
                {facts.map((fact) => (
                  <div key={fact.value} className="px-2 sm:px-5 py-3 sm:py-4 text-center border-l border-white/[0.05] first:border-l-0">
                    <div className="text-[11px] sm:text-sm font-semibold text-white/80">{fact.value}</div>
                    <div className="text-[10px] sm:text-xs text-white/30 mt-0.5 leading-tight">{fact.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </SlideFade>
        </div>

        {/* Slide 1: Catalog */}
        <div
          ref={(el) => { slideNodes.current[1] = el }}
          className={`slide-section absolute inset-0 flex items-center justify-center${initialClass(1)}${slide === 1 ? ' is-active' : ''}${slideMotionClass(1)}`}
          style={{ zIndex: 0 }}
        >
          <SlideFade active={slide === 1} delay={100} className="h-full w-full">
            <div className={SLIDE_BOX}>
              <GlassPanel className="reveal-block w-full max-w-6xl p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row gap-5 lg:gap-10">
                  <aside className="lg:w-56 shrink-0 flex flex-col gap-4">
                    <SectionHeading label="Каталог" title="Украшения и наборы" align="left" />
                    <div className="flex lg:flex-col gap-2">
                      {[
                        { key: 'decorations' as const, label: 'Украшения' },
                        { key: 'bundles' as const, label: 'Наборы' },
                      ].map((tab) => (
                        <button key={tab.key} onClick={() => setCategory(tab.key)}
                          aria-pressed={category === tab.key}
                          className={`flex-1 lg:flex-none px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-center lg:text-left transition-all duration-300 ${
                            category === tab.key
                              ? 'bg-white text-[#070708]'
                              : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/80'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <div className="h-px bg-white/[0.06] hidden lg:block" />
                    <div className="flex lg:flex-col gap-2">
                      {[
                        { key: 'no-nitro' as const, label: 'Без Nitro' },
                        { key: 'with-nitro' as const, label: 'С Nitro' },
                      ].map((tab) => (
                        <button key={tab.key} onClick={() => setNitroFilter(tab.key)}
                          aria-pressed={nitroFilter === tab.key}
                          className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-[11px] sm:text-xs font-medium tracking-wider text-center lg:text-left transition-all duration-300 ${
                            nitroFilter === tab.key
                              ? 'bg-white/10 text-white'
                              : 'text-white/30 hover:text-white/60'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </aside>

                  <div className="flex-1 min-w-0">
                    {/* key — только по вкладке. Раньше сюда входил ещё счётчик
                        входов на слайд, и каждое открытие каталога сносило всю
                        сетку и монтировало восемь плиток заново: восемь новых
                        <img> и восемь анимаций появления ровно в тот кадр,
                        когда идёт переход слайда. Смена вкладки перезапускает
                        появление и без счётчика. */}
                    <PriceGrid
                      key={category}
                      items={currentItems}
                      filler={category === 'bundles' ? { label: 'Свой вариант', desc: 'Напишите в бот' } : undefined}
                      tabKey={`${category}-${nitroFilter}`}
                      onAdd={onAdd}
                      onOpen={setDetail}
                    />
                    <div className="mt-4 sm:mt-6 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                      <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
                        className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white/60 font-medium hover:text-white/90 transition-colors text-xs sm:text-sm bg-white/[0.04] hover:bg-white/[0.08]"
                      >
                        Посмотреть все товары в Telegram
                        <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    </div>
                  </div>
                </div>
              </GlassPanel>
            </div>
          </SlideFade>
        </div>

        {/* Slide 2: How it works */}
        <div
          ref={(el) => { slideNodes.current[2] = el }}
          className={`slide-section absolute inset-0 flex items-center justify-center${initialClass(2)}${slide === 2 ? ' is-active' : ''}${slideMotionClass(2)}`}
          style={{ zIndex: 0 }}
        >
          <SlideFade active={slide === 2} delay={100} className="h-full w-full">
            <div className={SLIDE_BOX}>
              <div className="reveal-block w-full max-w-6xl">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-2 lg:gap-10 mb-6 lg:mb-10">
                  <SectionHeading label="Процесс" title="Как сделать заказ" align="left" />
                  <p className="text-white/30 text-sm leading-relaxed max-w-sm hidden lg:block">
                    Шесть шагов от корзины до готового профиля. Обычно занимает 10–15 минут.
                  </p>
                </div>

                {/* Две дорожки вместо одной колонки: заказ ровно посередине
                    переходит из ваших рук в наши, и раскладка показывает эту
                    границу до того, как прочитан хоть один шаг. */}
                <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-6 lg:gap-0">
                  {processTracks.map((track, t) => (
                    <Fragment key={track.key}>
                      {t > 0 && (
                        <div aria-hidden className="relative flex lg:flex-col items-center justify-center lg:mx-8">
                          <span className="h-px w-full lg:h-full lg:w-px bg-gradient-to-r lg:bg-gradient-to-b from-transparent via-white/[0.08] to-transparent" />
                          <span className="glass absolute w-8 h-8 rounded-full flex items-center justify-center text-white/30">
                            <ArrowRightIcon className="w-3.5 h-3.5 rotate-90 lg:rotate-0" />
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-4">
                          <span className={`text-[10px] tracking-[0.2em] uppercase ${track.key === 'us' ? 'text-brand/70' : 'text-white/40'}`}>
                            {track.label}
                          </span>
                          <span className="font-mono text-[10px] tabular-nums text-white/20 shrink-0">
                            {track.items[0].step}–{track.items[track.items.length - 1].step}
                          </span>
                          <span className="h-px flex-1 bg-gradient-to-r from-white/[0.08] to-transparent" />
                        </div>

                        <div className="relative">
                          <div aria-hidden className={`absolute left-5 top-3 bottom-3 w-px bg-gradient-to-b to-transparent ${track.key === 'us' ? 'from-brand/40 via-brand/15' : 'from-white/12 via-white/[0.05]'}`} />
                          <ol>
                            {track.items.map((item, i) => (
                              <li key={item.step} className="relative flex items-start gap-4 animate-fade-in" style={{ animationDelay: `${0.05 + (t * track.items.length + i) * 0.07}s` }}>
                                <div className={`relative z-10 shrink-0 w-10 h-10 rounded-xl glass flex items-center justify-center ${track.key === 'us' ? 'text-brand/60' : 'text-white/45'}`}>
                                  <StepIcon index={item.icon} className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0 pt-1.5 pb-4">
                                  <div className="flex items-baseline gap-2">
                                    <span className="font-mono text-[10px] tracking-wider text-white/20 tabular-nums">{item.step}</span>
                                    <h3 className="text-sm sm:text-base font-semibold text-white/75">{item.title}</h3>
                                  </div>
                                  <p className="text-white/30 text-xs sm:text-sm mt-0.5 leading-relaxed">{item.desc}</p>
                                </div>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
          </SlideFade>
        </div>

        {/* Slide 3: Payment */}
        <div
          ref={(el) => { slideNodes.current[3] = el }}
          className={`slide-section absolute inset-0 flex items-center justify-center${initialClass(3)}${slide === 3 ? ' is-active' : ''}${slideMotionClass(3)}`}
          style={{ zIndex: 0 }}
        >
          <SlideFade active={slide === 3} delay={100} className="h-full w-full">
            <div key={`payment-${paymentSeq}`} className={SLIDE_BOX}>
              <div className="reveal-block w-full max-w-5xl flex flex-col lg:flex-row items-center gap-8 lg:gap-14">
                <div className="lg:w-1/2 flex flex-col items-center lg:items-start">
                  <span className="glass rounded-full inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-white/30 px-4 py-1.5 mb-3">
                    <ShieldCheckIcon className="w-3 h-3" />
                    Безопасная оплата
                  </span>
                  <div className="text-center lg:text-left">
                    <SectionHeading title="Доступные способы" align="left" />
                  </div>

                  <div className="zoom-card glass glass-tinted rounded-2xl w-full max-w-xs mt-6 aspect-[1.586/1] p-5 sm:p-6 animate-fade-in overflow-hidden" style={{ animationDelay: '0.1s' }}>
                    <div className="relative flex flex-col justify-between h-full">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] tracking-[0.2em] uppercase text-white/30">Castello</span>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-white/10 border border-white/[0.08]" />
                          <div className="w-3 h-3 rounded-full bg-white/10 border border-white/[0.08]" />
                        </div>
                      </div>
                      {/* Чип — та деталь, по которой прямоугольник читается
                          картой ещё до того, как прочитан номер. */}
                      <div aria-hidden className="relative w-9 h-7 rounded-[5px] overflow-hidden bg-gradient-to-br from-white/20 to-white/[0.06]">
                        <span className="absolute inset-y-1 left-1/2 w-px bg-black/25" />
                        <span className="absolute inset-x-1 top-1/2 h-px bg-black/25" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex gap-1">
                            {[0, 1, 2, 3].map(i => (
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

                <div aria-hidden className="hidden lg:block w-px self-stretch bg-gradient-to-b from-transparent via-white/[0.07] to-transparent" />

                <div className="lg:w-1/2 w-full flex flex-col gap-3">
                  {/* Счётчик берётся из самих данных, поэтому не может разойтись
                      со списком под ним. */}
                  <div className="flex items-center gap-3 animate-fade-in">
                    <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/25 tabular-nums shrink-0">
                      {String(paymentMethods.length).padStart(2, '0')} способа
                    </span>
                    <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-white/[0.08] to-transparent" />
                  </div>

                  {/* Строка списка, а не карточка: вместо наклона в 3D — индиговый
                      рельс слева и подсветка плитки со значком. */}
                  {paymentMethods.map(({ label, desc, Icon, mark }, i) => (
                    <div key={label}
                      className="glass rounded-2xl relative overflow-hidden group flex items-center gap-4 p-4 animate-fade-in transition-[background-color] duration-500 hover:bg-white/[0.07]"
                      style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
                      <span aria-hidden className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-0 rounded-full bg-brand transition-all duration-500 ease-out group-hover:h-9" />
                      <div className={`shrink-0 w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center transition-colors duration-500 ${mark ? 'group-hover:bg-white/[0.12]' : 'group-hover:bg-brand/20'}`}>
                        <Icon className={mark ? 'w-6 h-6' : 'w-5 h-5 text-white/50 transition-colors duration-500 group-hover:text-white/90'} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm sm:text-base font-semibold text-white/80">{label}</div>
                        <p className="text-white/30 text-xs sm:text-sm mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}

                  {/* На слайде об оплате до сих пор не было куда нажать. Оплата
                      начинается с выбора товара, поэтому ведём в каталог. */}
                  <div className="glass rounded-2xl flex items-center justify-between gap-4 px-4 py-3 animate-fade-in" style={{ animationDelay: '0.34s' }}>
                    <p className="text-white/35 text-xs sm:text-sm leading-snug">
                      Заказ обрабатывается 10–15 минут после подтверждения платежа.
                    </p>
                    <button onClick={() => goToSlide(1)}
                      className="shrink-0 inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white/70 hover:text-white transition-colors">
                      В каталог
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </SlideFade>
        </div>

        {/* Slide 4: FAQ */}
        <div
          ref={(el) => { slideNodes.current[4] = el }}
          className={`slide-section absolute inset-0 flex items-center justify-center${initialClass(4)}${slide === 4 ? ' is-active' : ''}${slideMotionClass(4)}`}
          style={{ zIndex: 0 }}
        >
          <SlideFade active={slide === 4} delay={100} className="h-full w-full">
            <div className={SLIDE_BOX}>
              <div className="reveal-block w-full max-w-5xl flex flex-col lg:flex-row gap-6 lg:gap-14">
                <div className="lg:w-64 shrink-0 flex flex-col">
                  <SectionHeading label="FAQ" title="Частые вопросы" align="left" />
                  <p className="text-white/30 text-sm mt-3 leading-relaxed hidden lg:block">
                    Ответы на то, что спрашивают чаще всего — до оформления заказа.
                  </p>

                  {/* Список отвечает на шесть вопросов и заканчивается; седьмой
                      задают в боте, поэтому выход туда стоит прямо здесь. */}
                  <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
                    className="glass rounded-2xl relative overflow-hidden group flex items-center gap-3 p-4 mt-6 lg:mt-auto animate-fade-in transition-[background-color] duration-500 hover:bg-white/[0.07]"
                    style={{ animationDelay: '0.3s' }}>
                    <span aria-hidden className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-0 rounded-full bg-brand transition-all duration-500 ease-out group-hover:h-9" />
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center transition-colors duration-500 group-hover:bg-brand/20">
                      <TelegramIcon className="w-5 h-5 text-white/50 transition-colors duration-500 group-hover:text-white/90" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white/80">Не нашли ответ?</div>
                      <p className="text-white/30 text-xs mt-0.5">Спросите в Telegram-боте</p>
                    </div>
                    <ArrowRightIcon className="w-3.5 h-3.5 ml-auto shrink-0 text-white/20" />
                  </a>
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  {/* Счётчик берётся из самих данных — разойтись со списком под
                      ним он не может. */}
                  <div className="flex items-center gap-3 mb-1 animate-fade-in">
                    <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/25 tabular-nums shrink-0">
                      {String(faqData.length).padStart(2, '0')} вопросов
                    </span>
                    <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-white/[0.08] to-transparent" />
                  </div>

                  {faqData.map((item, i) => (
                    <FaqItem key={item.q} q={item.q} a={item.a} open={openFaq === i} delay={110 + i * 55} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
                  ))}
                </div>
              </div>
            </div>
          </SlideFade>
        </div>

        {/* Slide 5: Discord + CTA + Footer */}
        <div
          ref={(el) => { slideNodes.current[5] = el }}
          className={`slide-section absolute inset-0 flex items-center justify-center${initialClass(5)}${slide === 5 ? ' is-active' : ''}${slideMotionClass(5)}`}
          style={{ zIndex: 0 }}
        >
          <SlideFade active={slide === 5} delay={100} className="h-full w-full">
            <div className={SLIDE_BOX}>
              <div className="reveal-block w-full max-w-5xl grid lg:grid-cols-2 gap-4">
                <GlassPanel className="p-6 sm:p-8 flex flex-col items-start">
                  <span className="glass rounded-full inline-block text-[10px] tracking-[0.25em] uppercase text-white/30 px-4 py-1.5 mb-3">Сообщество</span>
                  <h2 className="text-2xl sm:text-3xl font-bold">Присоединяйтесь к Discord</h2>
                  <p className="text-white/40 text-sm sm:text-base mt-2 mb-6 leading-relaxed">
                    Общайтесь с другими пользователями, получайте новости и участвуйте в закрытых распродажах.
                  </p>
                  {/* mt-auto держит кнопки двух панелей на одной линии, даже
                      когда текст над ними разной длины. */}
                  <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer"
                    className="group relative inline-flex items-center gap-3 px-6 py-3 bg-brand text-white font-semibold text-sm sm:text-base rounded-2xl transition-all duration-300 hover:bg-[#4752c4] hover:scale-[1.03] active:scale-95 mt-auto">
                    <span className="absolute -inset-1 rounded-2xl bg-brand/20 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="relative flex items-center gap-3">
                      <DiscordIcon className="w-5 h-5" />
                      Зайти на сервер
                    </span>
                  </a>
                </GlassPanel>

                <GlassPanel className="p-6 sm:p-8 flex flex-col items-start">
                  <span className="glass rounded-full inline-block text-[10px] tracking-[0.25em] uppercase text-white/30 px-4 py-1.5 mb-3">Заказ</span>
                  <h2 className="text-2xl sm:text-3xl font-bold">Готовы начать?</h2>
                  <p className="text-white/40 text-sm sm:text-base mt-2 mb-6 leading-relaxed">
                    Выберите украшение или набор в боте. Выдача — в течение 10–15 минут после оплаты.
                  </p>
                  <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-6 py-3 bg-white text-[#070708] font-semibold text-sm sm:text-base rounded-2xl mt-auto transition-all duration-300 hover:bg-gray-100 hover:scale-[1.03] active:scale-95"
                  >
                    <TelegramIcon className="w-5 h-5" />
                    Перейти в Telegram-бот
                  </a>
                </GlassPanel>

                <footer className="lg:col-span-2 glass rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
                  <div>
                    <p className="text-white/60 text-xs sm:text-sm font-medium">ИП Бережной Егор Станиславович</p>
                    <p className="text-white/30 text-[10px] sm:text-xs mt-0.5">ИНН 910824288444 &nbsp;|&nbsp; ОГРНИП 325911200146721</p>
                  </div>
                  {/* Год на сборке и год у посетителя могут разойтись после Нового года —
                      для React это расхождение разметки, а тут оно безобидно. */}
                  <p suppressHydrationWarning className="text-white/20 text-[10px] sm:text-xs shrink-0">Castello Shop &copy; {new Date().getFullYear()}</p>
                </footer>
              </div>
            </div>
          </SlideFade>
        </div>
      </div>
    </div>
  )
}

export default App
