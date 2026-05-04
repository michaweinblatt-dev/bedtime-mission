import posthog from 'posthog-js';

/**
 * Fire a PostHog event. Wrapped in try/catch so analytics can never
 * crash or block the app under any circumstances.
 */
export function track(event, props = {}) {
  try {
    posthog.capture(event, props);
  } catch {}
}
