import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/theme.css'
// Legacy shared classes for screens not yet migrated to Tailwind. Remove in Phase 9.
import './features/analyzer/workspace.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
