export const GTM_ID = 'GTM-KHPLNV67'

export type AnalyticsParams = Record<string, string | number | boolean | null | undefined>

declare global {
  interface Window {
    dataLayer?: unknown[]
  }
}

/**
 * Pushes a named event to the Google Tag Manager data layer. In GTM, a "Custom Event" trigger
 * on the event name (or the regex `.*`) forwards it to GA4 with these params as event parameters.
 */
export function track(event: string, params: AnalyticsParams = {}) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...params })
}
