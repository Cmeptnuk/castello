import { useRef } from 'react'
import type { PointerEvent } from 'react'

/** Ставит на элемент координаты курсора в его собственной системе координат:
 *  блик на стекле рисуется радиальным градиентом с центром в --gx/--gy.
 *  Пишем прямо в style, минуя состояние — на каждом движении мыши
 *  перерисовывать дерево незачем, читатель у переменных только CSS.
 *
 *  Лежит отдельно от ui.tsx, потому что файл с компонентами не должен
 *  экспортировать ничего кроме компонентов — иначе ломается Fast Refresh. */
export function useSheen<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const rect = useRef<DOMRect | null>(null)
  const raf = useRef(0)
  const point = useRef({ x: 0, y: 0 })

  const onPointerEnter = () => {
    const el = ref.current
    if (!el) return
    rect.current = el.getBoundingClientRect()
    el.style.setProperty('--sheen', '1')
  }

  const onPointerMove = (e: PointerEvent) => {
    point.current = { x: e.clientX, y: e.clientY }
    if (raf.current) return
    raf.current = requestAnimationFrame(() => {
      raf.current = 0
      const el = ref.current
      const r = rect.current
      if (!el || !r) return
      el.style.setProperty('--gx', `${point.current.x - r.left}px`)
      el.style.setProperty('--gy', `${point.current.y - r.top}px`)
    })
  }

  const onPointerLeave = () => {
    ref.current?.style.setProperty('--sheen', '0')
  }

  return { ref, handlers: { onPointerEnter, onPointerMove, onPointerLeave } }
}
