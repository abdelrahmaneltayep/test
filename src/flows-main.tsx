import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { FlowsApp } from './flows/FlowsApp'
import './flows/flows.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode><FlowsApp /></StrictMode>,
)
