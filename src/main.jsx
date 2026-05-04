import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import posthog from 'posthog-js'
import { PostHogProvider } from '@posthog/react'

const POSTHOG_TOKEN = import.meta.env.VITE_PUBLIC_POSTHOG_TOKEN || 'phc_AdbPrpQ7miDRkhtsMAyxuAEKcMGfYj9UioZhCbQNzkt8';
const POSTHOG_HOST = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
console.log('[PostHog]', POSTHOG_TOKEN)
posthog.init(POSTHOG_TOKEN, {
  api_host: POSTHOG_HOST,
  defaults: '2026-01-30',
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <App />
    </PostHogProvider>
  </StrictMode>,
)
