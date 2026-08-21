import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { StoriesApp } from './stories/StoriesApp'
import './stories/stories.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode><StoriesApp /></StrictMode>,
)
