export function trackEvent(name, data = {}) {
  if (window.umami) {
    window.umami.track(name, data);
  }
}
