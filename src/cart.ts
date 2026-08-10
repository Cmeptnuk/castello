import type { PriceItem } from './data.ts'

/* Корзина живёт в localStorage, а его на сервере нет. Читать её прямо в
   useState нельзя: разметка с сервера пришла бы с пустой корзиной, а первый
   рендер клиента — с заполненной, и гидратация сломалась бы у всех, кто уже
   что-то отложил. useSyncExternalStore решает это штатно: при гидратации
   берётся серверный снимок, следом React перерисовывает уже с клиентским. */
const CART_KEY = 'cart'
const EMPTY_CART: PriceItem[] = []
const listeners = new Set<() => void>()
let raw: string | null = null
let snapshot: PriceItem[] = EMPTY_CART

export function readCart(): PriceItem[] {
  let next: string | null = null
  try { next = localStorage.getItem(CART_KEY) } catch { /* хранилище недоступно */ }
  // Снимок обязан быть стабильным по ссылке, иначе useSyncExternalStore
  // уйдёт в бесконечную перерисовку — поэтому парсим только при изменении.
  if (next !== raw) {
    raw = next
    try { snapshot = next ? JSON.parse(next) : EMPTY_CART } catch { snapshot = EMPTY_CART }
  }
  return snapshot
}

export function writeCart(next: PriceItem[]) {
  snapshot = next
  raw = JSON.stringify(next)
  try { localStorage.setItem(CART_KEY, raw) } catch { /* приватный режим, блокировка cookie, in-app браузер */ }
  listeners.forEach((notify) => notify())
}

export const subscribeCart = (notify: () => void) => {
  listeners.add(notify)
  return () => { listeners.delete(notify) }
}

export const serverCart = () => EMPTY_CART
