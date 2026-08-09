import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { slideFromPath } from './slides.ts'

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <App initialSlide={slideFromPath(window.location.pathname)} />
  </StrictMode>
)

// Продакшн отдаёт готовую разметку, её надо гидратировать. Dev-сервер отдаёт
// пустой контейнер — там гидратация нашла бы расхождение, поэтому обычный рендер.
if (root.firstChild) {
  hydrateRoot(root, app)
} else {
  createRoot(root).render(app)
}
