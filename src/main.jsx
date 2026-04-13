import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from '@/App.jsx'
import '@/index.css'
import { clerkPublishableKey } from '@/lib/env'
import { initializeAppShell } from '@/lib/app-shell'

const MissingConfigScreen = () => (
  <div className="min-h-[var(--app-viewport-height)] bg-[#0a0a0a] text-white flex items-center justify-center px-6">
    <div className="max-w-xl text-center">
      <p className="text-[#E50914] font-black text-4xl mb-4 tracking-tight">SUBFLIX</p>
      <h1 className="text-2xl font-bold mb-3">Missing Clerk configuration</h1>
      <p className="text-gray-400 leading-relaxed">
        Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` or `VITE_CLERK_PUBLISHABLE_KEY`
        to your local environment before starting the app.
      </p>
    </div>
  </div>
)

const teardownAppShell = initializeAppShell()

ReactDOM.createRoot(document.getElementById('root')).render(
  clerkPublishableKey ? (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <App />
    </ClerkProvider>
  ) : (
    <MissingConfigScreen />
  )
)

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    teardownAppShell?.()
  })
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
