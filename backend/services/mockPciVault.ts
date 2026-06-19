import * as crypto from 'crypto';

export interface TokenizationResult {
  token: string;
  cardBrand: string;
  masked: string;
  timestamp: string;
}

/**
 * Validates a PAN (Primary Account Number) using the standard Luhn algorithm (mod 10).
 */
export function validateLuhn(pan: string): boolean {
  const sanitized = pan.replace(/\D/g, '');
  if (sanitized.length < 13 || sanitized.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Superficially identifies the credit card issuer brand.
 */
export function getCardBrand(pan: string): string {
  const sanitized = pan.replace(/\D/g, '');
  if (/^4/.test(sanitized)) return 'Visa';
  if (/^5[1-5]/.test(sanitized)) return 'Mastercard';
  if (/^3[47]/.test(sanitized)) return 'American Express';
  if (/^6(?:011|5)/.test(sanitized)) return 'Discover';
  return 'Generic Credit';
}

/**
 * Mask the credit card number, leaving only the last 4 digits visible.
 */
export function maskPan(pan: string): string {
  const sanitized = pan.replace(/\D/g, '');
  if (sanitized.length < 4) return '••••';
  const lastFour = sanitized.slice(-4);
  const leadingMaskLength = sanitized.length - 4;
  return '•'.repeat(leadingMaskLength) + ' ' + lastFour;
}

/**
 * Tokenizes the raw PAN, returning a clean non-reversible lookup reference.
 * The original raw numerical PAN is NEVER logged or preserved in permanent storage.
 */
export function tokenizeCard(pan: string): TokenizationResult {
  const sanitized = pan.replace(/\D/g, '');
  const brand = getCardBrand(sanitized);
  const masked = maskPan(sanitized);

  // Generate a mock secure token: prefix + cryptographically random 16-character hex suffix
  const secureRandomBytes = crypto.randomBytes(12).toString('hex');
  const token = `tok_pci_vp_${secureRandomBytes}`;

  return {
    token,
    cardBrand: brand,
    masked,
    timestamp: new Date().toISOString(),
  };
}
