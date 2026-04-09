import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { OnboardingFlowId } from '@/onboarding/flows'
import { getOnboardingSteps } from '@/onboarding/flows'
import { OnboardingSheet } from '@/components/onboarding/OnboardingSheet'

type OnboardingContextValue = {
  openFlow: (id: OnboardingFlowId) => void
  closeFlow: () => void
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext)
  if (!ctx) {
    throw new Error('useOnboarding должен вызываться внутри OnboardingProvider')
  }
  return ctx
}

/**
 * Глобальная справка: один sheet, смена flowId подставляет другой набор слайдов.
 */
export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [flowId, setFlowId] = useState<OnboardingFlowId | null>(null)

  const openFlow = useCallback((id: OnboardingFlowId) => {
    setFlowId(id)
    setOpen(true)
  }, [])

  const closeFlow = useCallback(() => {
    setOpen(false)
    setFlowId(null)
  }, [])

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next)
    if (!next) setFlowId(null)
  }, [])

  const steps = useMemo(() => {
    if (!flowId) return []
    return getOnboardingSteps(flowId)
  }, [flowId])

  const value = useMemo(
    () => ({ openFlow, closeFlow }),
    [openFlow, closeFlow],
  )

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      <OnboardingSheet
        open={open && steps.length > 0}
        onOpenChange={handleOpenChange}
        flowId={flowId}
        steps={steps}
      />
    </OnboardingContext.Provider>
  )
}
