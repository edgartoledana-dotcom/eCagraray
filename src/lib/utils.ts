import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// Input sanitization helpers
// ---------------------------------------------------------------------------

/**
 * Strip HTML tags from a string to prevent XSS attacks.
 * Use for user-supplied text that will be rendered dangerously or logged.
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/**
 * Sanitize a string for safe display: strip HTML, trim whitespace,
 * normalize Unicode whitespace, and limit length.
 */
export function sanitizeText(input: string, maxLength: number = 5000): string {
  return stripHtml(input)
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // Zero-width characters
    .slice(0, maxLength);
}

/**
 * Normalize an email address: lowercase, trim, strip special chars.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase().replace(/[<>()\[\]\\,;:\s]/g, "");
}


