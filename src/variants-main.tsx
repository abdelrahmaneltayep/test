import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { VariantsGallery } from './variants/VariantsGallery'
import './rfq/rfq.css'
import './variants/variants.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode><VariantsGallery /></StrictMode>,
)
