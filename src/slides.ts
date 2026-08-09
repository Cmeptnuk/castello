export const SLIDE_KEYS = ['home', 'catalog', 'how', 'payment', 'faq', 'discord']

/** На сервере window нет, поэтому стартовый слайд приходит пропом: пререндер
 *  подставляет его по маршруту, клиент считает из адреса. Значения обязаны
 *  совпасть, иначе гидратация найдёт расхождение в разметке.
 *
 *  Хвост .html снимается специально: на Vercel маршрут /catalog переписывается
 *  на /catalog.html, но если кто-то откроет файл напрямую, слайд должен
 *  получиться тот же самый. */
export function slideFromPath(pathname: string) {
  const key = pathname.replace(/^\//, '').replace(/\.html$/, '')
  const idx = SLIDE_KEYS.indexOf(key)
  return idx >= 0 ? idx : 0
}
