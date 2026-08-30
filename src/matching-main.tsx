import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MatchingApp } from './matching/MatchingApp'
// The embedded screens are the real ones, so they need the real stylesheet. It comes
// first: the sheet's own frame is written to sit on top of it, not to fight it.
import './rfq/rfq.css'
import './matching/matching.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode><MatchingApp /></StrictMode>,
)
