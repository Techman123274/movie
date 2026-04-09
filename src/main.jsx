import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from '@/App.jsx'
import '@/index.css'
import { clerkPublishableKey } from '@/lib/env'

const MissingConfigScreen = () => (
  <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6">
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

ReactDOM.createRoot(document.getElementById('root')).render(
  clerkPublishableKey ? (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <App />
    </ClerkProvider>
  ) : (
    <MissingConfigScreen />
  )
)
