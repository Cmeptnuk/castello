import { useEffect, useRef, useSyncExternalStore } from 'react'

const HOVER_QUERY = '(hover: hover) and (pointer: fine)'
const serverFalse = () => false

export function CursorTrail() {
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
    const animate = () => {
      let cx = pos.current.x
      let cy = pos.current.y
      let moved = false
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i]
        if (!dot) continue
        const px = parseFloat(dot.dataset.cx || String(cx))
        const py = parseFloat(dot.dataset.cy || String(cy))
        const nx = px + (cx - px) * (0.18 - i * 0.008)
        const ny = py + (cy - py) * (0.18 - i * 0.008)
        if (Math.abs(nx - px) > 0.05 || Math.abs(ny - py) > 0.05) moved = true
        dot.dataset.cx = String(nx)
        dot.dataset.cy = String(ny)
        dot.style.transform = `translate(${nx}px, ${ny}px)`
        cx = nx
        cy = ny
      }
      // Хвост догнал курсор — цикл останавливается до следующего движения.
      // Раньше кадр пересчитывался всегда, и десять точек с mix-blend-difference
      // заставляли композитор перечитывать фон под собой даже у неподвижной мыши.
      raf.current = moved ? requestAnimationFrame(animate) : 0
    }
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY }
      if (!raf.current) raf.current = requestAnimationFrame(animate)
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
