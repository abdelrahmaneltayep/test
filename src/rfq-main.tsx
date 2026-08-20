import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './rfq/components/App'
import './rfq/rfq.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
)
