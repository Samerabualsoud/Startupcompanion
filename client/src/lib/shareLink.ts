/**
 * shareLink.ts — Encode/decode valuation chat answers into a shareable URL
 * Uses base64url + JSON compression for compact URLs
 */

/**
 * Encode answers object into a base64url string and append to current URL
 */
export function encodeAnswersToURL(answers: Record<string, any>): string {
  try {
    const json = JSON.stringify(answers);
    const encoded = btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const url = new URL(window.location.href);
    url.searchParams.set('v', encoded);
    return url.toString();
  } catch {
    return window.location.href;
  }
}

/**
 * Decode answers from current URL's ?v= parameter
 * Returns null if not present or invalid
 */
export function decodeAnswersFromURL(): Record<string, any> | null {
  try {
    const url = new URL(window.location.href);
    const encoded = url.searchParams.get('v');
    if (!encoded) return null;
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(base64)));
    const parsed = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Copy a string to clipboard, returns true on success
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  }
}
