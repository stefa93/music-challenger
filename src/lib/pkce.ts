/**
 * Generates a random string for the PKCE code verifier.
 * @param length The length of the string to generate (default: 128)
 * @returns A random string.
 */
export function generateCodeVerifier(length: number = 128): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

/**
 * Generates the PKCE code challenge based on the code verifier.
 * Uses SHA-256 hashing and Base64 URL encoding.
 * @param codeVerifier The code verifier string.
 * @returns A promise that resolves with the Base64 URL-encoded code challenge.
 */
export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);

  // Base64 URL encode the ArrayBuffer
  // btoa expects a string, so convert buffer to string of char codes
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-') // Replace '+' with '-'
    .replace(/\//g, '_') // Replace '/' with '_'
    .replace(/=+$/, ''); // Remove trailing '='

  return base64;
}