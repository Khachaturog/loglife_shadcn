import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Theme } from '@radix-ui/themes'
import '@radix-ui/themes/styles.css'
import 'air-datepicker/air-datepicker.css'
import '@/styles/air-datepicker-overrides.css'
import { AuthProvider } from '@/lib/auth-context'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Theme accentColor="indigo" grayColor="slate" radius="large" scaling="100%">
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </Theme>
  </StrictMode>,
)
