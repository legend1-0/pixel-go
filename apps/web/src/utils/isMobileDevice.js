// apps/web/src/utils/isMobileDevice.js

/**
 * Detects whether the current device is a phone/tablet OS, based on
 * user agent + touch-capability signals — NOT viewport width, since a
 * desktop user can resize their browser window narrow and should still
 * be treated as desktop.
 *
 * Known limitation: modern iPadOS deliberately reports itself as
 * "Macintosh" in the user agent (since iOS 13), specifically to make
 * iPad vs. Mac detection hard. The maxTouchPoints check below is the
 * standard workaround, but it's a heuristic, not a guarantee.
 * @returns {boolean}
 */
export function isMobileDevice() {
  if (typeof navigator === "undefined") return false;

  // Modern Chromium browsers expose this directly and reliably
  if (navigator.userAgentData && typeof navigator.userAgentData.mobile === "boolean") {
    return navigator.userAgentData.mobile;
  }

  const ua = navigator.userAgent || navigator.vendor || "";
  const mobileRegex = /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Windows Phone|Mobile/i;
  if (mobileRegex.test(ua)) return true;

  // iPad pretending to be a Mac: real Macs don't report multi-touch
  const isIPadPretendingToBeMac = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;

  return isIPadPretendingToBeMac;
}