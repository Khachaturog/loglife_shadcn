import { IconButton } from '@radix-ui/themes'
import { QuestionMarkIcon } from '@radix-ui/react-icons'
import type { OnboardingFlowId } from '@/onboarding/flows'
import { useOnboarding } from '@/lib/onboarding-context'

type Props = {
  flowId: OnboardingFlowId
}

/**
 * Кнопка «?» в AppBar: открывает контекстную справку для текущего экрана.
 */
export function OnboardingHelpButton({ flowId }: Props) {
  const { openFlow } = useOnboarding()

  return (
    <IconButton
      type="button"
      size="3"
      color="gray"
      variant="classic"
      radius="full"
      aria-label="Справка"
      onClick={() => openFlow(flowId)}
    >
      <QuestionMarkIcon />
    </IconButton>
  )
}
