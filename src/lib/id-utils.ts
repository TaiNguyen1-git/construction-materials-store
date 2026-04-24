import Hashids from 'hashids';

/**
 * ID Obfuscation Utility
 * Uses Hashids to encode/decode MongoDB ObjectIDs into shorter, non-sequential strings.
 */

// Use a salt from environment variables or fallback to a default
const SALT = process.env.ID_SALT || 'smartbuild-secure-construction-platform-2026';
const MIN_LENGTH = 10;
const hashids = new Hashids(SALT, MIN_LENGTH);

/**
 * Encodes a MongoDB hex ID into a short hashid
 */
export const encodeId = (hexId: string): string => {
  if (!hexId) return '';
  try {
    return hashids.encodeHex(hexId);
  } catch (error) {
    console.error('Error encoding ID:', error);
    return hexId;
  }
};

/**
 * Decodes a short hashid back into a MongoDB hex ID
 */
export const decodeId = (shortId: string): string => {
  if (!shortId) return '';
  try {
    // If it looks like a hex ID already (24 chars), return as is (for backwards compatibility)
    if (shortId.length === 24 && /^[0-9a-fA-F]+$/.test(shortId)) {
      return shortId;
    }
    return hashids.decodeHex(shortId);
  } catch (error) {
    console.error('Error decoding ID:', error);
    return shortId;
  }
};
