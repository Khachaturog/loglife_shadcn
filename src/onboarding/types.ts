/**
 * Один слайд контекстной справки (bottom sheet).
 * Картинку можно положить в public/onboarding/ и указать путь без ведущего слэша.
 */
export type OnboardingStep = {
  title: string
  description: string
  /** Например onboarding/example.webp — к URL добавляется import.meta.env.BASE_URL */
  imageSrc?: string
  imageAlt?: string
}
