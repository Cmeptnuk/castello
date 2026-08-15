export interface PriceItem {
  label: string
  priceUSD: number
  priceRUB: number
  /** Путь к арту в public. Нет файла — нет поля: карточка рисует заглушку,
   *  а не битую картинку и не чужой арт из другой категории. */
  art?: string
  /** Изображение для плитки каталога. Может совпадать с полным артом, если
   *  отдельное уменьшенное превью для файла не подготовлено. */
  thumb?: string
}

export type CategoryTab = 'decorations' | 'bundles'
export type NitroTab = 'no-nitro' | 'with-nitro'

/** Описание группы товаров для окна с подробностями. Строка прайса — это
 *  ценовая категория, а не конкретный предмет: внутри группы состав покупки
 *  один и тот же, меняется только цена. Поэтому текст висит на группе. */
export interface CatalogCopy {
  /** Заголовок окна. */
  noun: string
  /** Абзац о том, что это такое. */
  about: string
  /** Что входит в покупку. */
  includes: string[]
  /** Требование к аккаунту — единственное, чем вкладки Nitro отличаются. */
  account: string
}

const DELIVERY = 'Готово за 10–15 минут после оплаты'
const NO_NITRO_ACCOUNT = 'Nitro не нужен — категория собрана для аккаунтов без подписки.'
const NITRO_ACCOUNT = 'Нужен активный Discord Nitro: без него оформление не откроется.'

export const catalogCopy: Record<CategoryTab, Record<NitroTab, CatalogCopy>> = {
  decorations: {
    'no-nitro': {
      noun: 'Украшение профиля',
      about: 'Отдельный элемент оформления Discord — рамка аватара, баннер или цвет ника. Покупку проводим через ваш аккаунт, от вас нужны только данные для входа.',
      includes: ['Одно украшение на выбор', 'Покупку оформляем за вас', DELIVERY],
      account: NO_NITRO_ACCOUNT,
    },
    'with-nitro': {
      noun: 'Украшение профиля',
      about: 'Отдельный элемент оформления из витрины, которая открыта подписчикам Nitro. Покупку проводим через ваш аккаунт, от вас нужны только данные для входа.',
      includes: ['Одно украшение на выбор', 'Покупку оформляем за вас', DELIVERY],
      account: NITRO_ACCOUNT,
    },
  },
  bundles: {
    'no-nitro': {
      noun: 'Набор украшений',
      about: 'Комплект из нескольких украшений в одном стиле — вместе они стоят меньше, чем те же элементы по отдельности.',
      includes: ['Рамка аватара, баннер, цвет ника', 'Все элементы в одном стиле', DELIVERY],
      account: NO_NITRO_ACCOUNT,
    },
    'with-nitro': {
      noun: 'Набор украшений',
      about: 'Комплект из нескольких украшений витрины Nitro в одном стиле — вместе они стоят меньше, чем те же элементы по отдельности.',
      includes: ['Рамка аватара, баннер, цвет ника', 'Все элементы в одном стиле', DELIVERY],
      account: NITRO_ACCOUNT,
    },
  },
}

/* public/ не сканируется браузером во время выполнения, поэтому список
   строится из имён файлов, которые лежат в репозитории. Сортировка с
   numeric:true сохраняет ожидаемый порядок Decorations1, Decorations2, ...
   даже если позже появятся двузначные номера. */
const sortedCardImages = (folder: 'Decorations' | 'Packs', prefix: 'Decorations' | 'Packs', count: number) =>
  Array.from({ length: count }, (_, index) => `/ItemsCards/${folder}/${prefix}${index + 1}.png`)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))

const decorationsArt = sortedCardImages('Decorations', 'Decorations', 8)
const packsArt = sortedCardImages('Packs', 'Packs', 7)

const withCardArt = (items: PriceItem[], images: string[]): PriceItem[] =>
  items.map((item, index) => {
    const art = images[index]
    return art ? { ...item, art } : item
  })

export const decorationsNoNitro: PriceItem[] = withCardArt([
  { label: 'Украшение', priceUSD: 5.99, priceRUB: 159.99 },
  { label: 'Украшение', priceUSD: 7.99, priceRUB: 279.99 },
  { label: 'Украшение', priceUSD: 8.99, priceRUB: 379.99 },
  { label: 'Украшение', priceUSD: 9.99, priceRUB: 389.99 },
  { label: 'Украшение', priceUSD: 10.99, priceRUB: 439.99 },
  { label: 'Украшение', priceUSD: 11.99, priceRUB: 459.99 },
  { label: 'Украшение', priceUSD: 12.99, priceRUB: 489.99 },
  { label: 'Украшение', priceUSD: 15.99, priceRUB: 589.99 },
], decorationsArt)

export const bundlesNoNitro: PriceItem[] = withCardArt([
  { label: 'Набор', priceUSD: 10.99, priceRUB: 399.99 },
  { label: 'Набор', priceUSD: 12.99, priceRUB: 489.99 },
  { label: 'Набор', priceUSD: 15.99, priceRUB: 589.99 },
  { label: 'Набор', priceUSD: 17.99, priceRUB: 679.99 },
  { label: 'Набор', priceUSD: 20.99, priceRUB: 709.99 },
  { label: 'Набор', priceUSD: 23.99, priceRUB: 869.99 },
  { label: 'Набор', priceUSD: 28.99, priceRUB: 999.99 },
], packsArt)

export const decorationsWithNitro: PriceItem[] = withCardArt([
  { label: 'Украшение', priceUSD: 4.99, priceRUB: 119.99 },
  { label: 'Украшение', priceUSD: 5.99, priceRUB: 159.99 },
  { label: 'Украшение', priceUSD: 6.99, priceRUB: 269.99 },
  { label: 'Украшение', priceUSD: 7.99, priceRUB: 279.99 },
  { label: 'Украшение', priceUSD: 8.49, priceRUB: 369.99 },
  { label: 'Украшение', priceUSD: 8.99, priceRUB: 379.99 },
  { label: 'Украшение', priceUSD: 9.99, priceRUB: 410.99 },
  { label: 'Украшение', priceUSD: 11.99, priceRUB: 459.99 },
], decorationsArt)

export const bundlesWithNitro: PriceItem[] = withCardArt([
  { label: 'Набор', priceUSD: 8.99, priceRUB: 379.99 },
  { label: 'Набор', priceUSD: 9.99, priceRUB: 389.99 },
  { label: 'Набор', priceUSD: 11.99, priceRUB: 459.99 },
  { label: 'Набор', priceUSD: 13.99, priceRUB: 549.99 },
  { label: 'Набор', priceUSD: 15.99, priceRUB: 589.99 },
  { label: 'Набор', priceUSD: 17.99, priceRUB: 679.99 },
  { label: 'Набор', priceUSD: 22.99, priceRUB: 849.99 },
], packsArt)

export const faqData = [
  { q: 'Как сделать заказ?', a: 'Нажмите на кнопку «Перейти в Telegram-бот» — откроется чат с ботом. Выберите нужную категорию, товар и следуйте инструкциям. Весь процесс занимает несколько минут.' },
  { q: 'Какие способы оплаты доступны?', a: 'Оплата принимается картами РФ, СБП и криптовалютой (TON, USDT TON/TRC-20, Solana). Все способы доступны при оформлении заказа.' },
  { q: 'Нужен ли Discord Nitro для заказа?', a: 'Нет, не обязательно. В нашем каталоге представлены отдельные категории товаров для аккаунтов без Nitro и с Nitro. Вы можете выбрать подходящий вариант.' },
  { q: 'Как быстро я получу товар после оплаты?', a: 'В течение 10–15 минут после подтверждения платежа заказ обрабатывается и товар отправляется.' },
  { q: 'Что такое «украшения» и «наборы»?', a: 'Украшения — это отдельные элементы для профиля Discord (рамка аватара, баннер, цвет ника и т.д.). Наборы представляют собой комплект из нескольких украшений по выгодной цене.' },
  { q: 'Как работает возврат?', a: 'Возврат товара осуществляется только в случае, если проблема возникла по нашей вине. В остальных случаях возврат не предусмотрен.' },
]

/** Кто выполняет шаг. Ровно посередине процесса исполнитель меняется:
 *  первые три шага делает покупатель, последние три — продавец. Поле держит
 *  этот факт рядом с текстом, чтобы схема на сайте не угадывала его по номеру. */
export type StepActor = 'you' | 'us'

export const steps: { step: string; actor: StepActor; title: string; desc: string }[] = [
  { step: '01', actor: 'you', title: 'Оформление заказа', desc: 'Добавьте товары в корзину и укажите данные Discord.' },
  { step: '02', actor: 'you', title: 'Оплата', desc: 'Выберите способ оплаты и оплатите заказ на сайте.' },
  { step: '03', actor: 'you', title: 'Предоставление данных', desc: 'Вы передаёте данные от аккаунта Discord для входа.' },
  { step: '04', actor: 'us', title: 'Продавец заходит в аккаунт', desc: 'Мы получаем доступ к вашему аккаунту Discord.' },
  { step: '05', actor: 'us', title: 'Оформление покупки', desc: 'Продавец приобретает украшения через ваш аккаунт.' },
  { step: '06', actor: 'us', title: 'Заказ завершён', desc: 'Подтверждаем выполнение — вы получаете готовый профиль.' },
]

export const navItems = [
  { key: 'home', label: 'Главная' },
  { key: 'catalog', label: 'Каталог' },
  { key: 'how', label: 'Процесс' },
  { key: 'payment', label: 'Оплата' },
  { key: 'faq', label: 'FAQ' },
  { key: 'discord', label: 'Discord' },
]

export const TELEGRAM_URL = 'https://t.me/CastelloShop_bot'
export const DISCORD_URL = 'https://discord.gg/uA4vu9CXHE'
