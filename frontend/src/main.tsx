import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

/**
 * The theme is resolved by the inline script in index.html before first paint.
 * Rendering the real app into the already-mounted node (instead of replacing
 * it) preserves the <html data-theme> attribute and prevents a flash.
 */
const root = document.getElementById('root') as HTMLElement

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)