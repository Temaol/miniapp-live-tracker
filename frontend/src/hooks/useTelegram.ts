import { useEffect, useRef } from 'react'
import type { TelegramUser } from '../types'

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void
        expand: () => void
        close: () => void
        initData: string
        initDataUnsafe: {
          user?: TelegramUser
          query_id?: string
        }
        colorScheme: 'light' | 'dark'
        themeParams: Record<string, string>
        MainButton: {
          text: string
          color: string
          textColor: string
          isVisible: boolean
          isActive: boolean
          show: () => void
          hide: () => void
          enable: () => void
          disable: () => void
          onClick: (fn: () => void) => void
          offClick: (fn: () => void) => void
          setText: (text: string) => void
        }
        BackButton: {
          isVisible: boolean
          show: () => void
          hide: () => void
          onClick: (fn: () => void) => void
          offClick: (fn: () => void) => void
        }
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void
          selectionChanged: () => void
        }
        onEvent: (event: string, fn: () => void) => void
        offEvent: (event: string, fn: () => void) => void
        version: string
        platform: string
        isExpanded: boolean
      }
    }
  }
}

type TelegramWebApp = NonNullable<Window['Telegram']>['WebApp']

export interface UseTelegramReturn {
  webApp: TelegramWebApp | null
  user: TelegramUser | null
  colorScheme: 'light' | 'dark'
  isReady: boolean
  hapticImpact: (style?: 'light' | 'medium' | 'heavy') => void
  hapticNotification: (type?: 'success' | 'error' | 'warning') => void
}

export function useTelegram(): UseTelegramReturn {
  const webApp: TelegramWebApp | null = window.Telegram?.WebApp ?? null
  const readyCalled = useRef(false)

  useEffect(() => {
    if (webApp && !readyCalled.current) {
      webApp.ready()
      webApp.expand()
      readyCalled.current = true
    }
  }, [webApp])

  const user = webApp?.initDataUnsafe?.user ?? null

  // Dev fallback user when running outside Telegram
  const devUser: TelegramUser = {
    id: 999999,
    first_name: 'Dev',
    last_name: 'User',
    username: 'devuser',
  }

  return {
    webApp,
    user: user ?? devUser,
    colorScheme: webApp?.colorScheme ?? 'light',
    isReady: !!webApp,
    hapticImpact: (style = 'medium') =>
      webApp?.HapticFeedback?.impactOccurred(style),
    hapticNotification: (type = 'success') =>
      webApp?.HapticFeedback?.notificationOccurred(type),
  }
}
