/**
 * Simple sanitization helper to strip dangerous tags (like <script>) 
 * and trim whitespace to prevent basic XSS and injection attacks.
 */
export function sanitize(value: string): string {
  if (!value) return '';
  return value.replace(/[<>]/g, '').trim();
}
