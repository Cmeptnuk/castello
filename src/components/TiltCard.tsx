import { useRef, useSyncExternalStore } from 'react'

const noSubscribe = () => () => {}
const serverFalse = () => false

/** Наклон карточки к курсору и блик под ним. Обе величины пишутся прямо в
 *  style элемента: состояние здесь только вызывало бы перерисовку дерева на
 *  каждом движении мыши.
 *
 *  Остальные пропсы уходят на div как есть — карточке каталога нужны onClick,
 *  role и tabIndex, чтобы открывать окно товара и с клавиатуры тоже. */
export function TiltCard({ children, className, style, ...rest }: React.ComponentPropsWithoutRef<'div'>) {
  const ref = useRef<HTMLDivElement>(null)
  const rectRef = useRef<DOMRect | null>(null)
  const raf = useRef(0)
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined)
  const point = useRef({ x: 0, y: 0 })
  // Определяется после гидратации: на сервере window нет, а решать это во время
  // рендера значило бы отдать с сервера и с клиента разную разметку.
  const isTouch = useSyncExternalStore(noSubscribe, () => 'ontouchstart' in window, serverFalse)
  const lift = -4

  const onEnter = () => {
    if (!ref.current) return
    // Возврат после прошлого ухода мог ещё не закончиться — иначе его уборка
    // сработает уже посреди нового наведения и снимет слой под наклоном.
    clearTimeout(settle.current)
    rectRef.current = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--sheen', '1')
    // will-change живёт только на время наведения. Постоянный слой на каждой
    // карточке — восемь текстур в сетке каталога, которые композитор держит
    // всё время, хотя двигается всегда ровно одна.
    ref.current.style.willChange = 'transform'
    ref.current.style.transition = 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    ref.current.style.transform = `translateY(${lift}px)`
  }

  const onMove = (e: React.PointerEvent) => {
    if (isTouch) return
    point.current = { x: e.clientX, y: e.clientY }
    if (raf.current) return
    raf.current = requestAnimationFrame(() => {
      raf.current = 0
      const el = ref.current
      const r = rectRef.current
      if (!el || !r) return
      const x = point.current.x - r.left
      const y = point.current.y - r.top
      el.style.setProperty('--gx', `${x}px`)
      el.style.setProperty('--gy', `${y}px`)
      el.style.transition = 'transform 0.08s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      el.style.transform = `perspective(400px) translateY(${lift}px) rotateX(${(y - r.height / 2) / 24}deg) rotateY(${(r.width / 2 - x) / 24}deg)`
    })
  }

  const onLeave = () => {
    if (isTouch || !ref.current) return
    ref.current.style.setProperty('--sheen', '0')
    ref.current.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    ref.current.style.transform = 'perspective(400px) rotateX(0deg) rotateY(0deg)'
    // Слой снимаем не сразу, а вместе с переходом: пока карточка возвращается
    // в исходное положение, он ещё нужен.
    clearTimeout(settle.current)
    settle.current = setTimeout(() => {
      if (!ref.current) return
      ref.current.style.transition = ''
      ref.current.style.willChange = ''
    }, 400)
  }

  if (isTouch) {
    return <div className={className} style={style} {...rest}>{children}</div>
  }

  return (
    <div
      ref={ref}
      {...rest}
      onPointerEnter={onEnter}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={className}
      style={style}
    >
      {children}
    </div>
  )
}
