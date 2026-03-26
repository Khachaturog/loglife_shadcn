import { WebHaptics } from 'web-haptics'
import type { HapticInput, TriggerOptions } from 'web-haptics'

/**
 * Один экземпляр на приложение (без showSwitch).
 * `debug` у библиотеки не включаем — иначе при отсутствии Vibration API играет звуковой клик;
 * нужны только нативные вибрации там, где `navigator.vibrate` доступен.
 *
 * Ранний return при `!isSupported` не делаем: `trigger()` безопасен, лишний звук не включается.
 */
const haptics = new WebHaptics({
  debug: false,
})

/** Дефолт для вызова без аргумента — заметная отдача (см. пресеты web-haptics). */
const defaultTap: HapticInput = 'heavy'

export function triggerHaptic(input?: HapticInput, options?: TriggerOptions) {
  void haptics.trigger(input ?? defaultTap, options)
}

export { WebHaptics }
