/**
 * Encryption utilities for protecting exported vault data
 * Uses Web Crypto API with AES-GCM-256 and PBKDF2
 */

const ENCRYPTION_HEADER = 'LEGACY_VAULT_ENCRYPTED_v1:'
const PBKDF2_ITERATIONS = 100000 // High iteration count for security
const SALT_LENGTH = 16 // 16 bytes = 128 bits
const IV_LENGTH = 12 // 12 bytes = 96 bits for GCM
const KEY_LENGTH = 256 // 256 bits

/**
 * Derive a cryptographic key from a password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  // Convert password to ArrayBuffer
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  // Derive key using PBKDF2
  // Create a new ArrayBuffer from the salt to ensure proper type
  const saltBuffer = new Uint8Array(salt).buffer
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    {
      name: 'AES-GCM',
      length: KEY_LENGTH,
    },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt data with a password
 * Returns a base64-encoded string with format: HEADER|base64(salt|iv|ciphertext)
 */
export async function encrypt(plaintext: string, password: string): Promise<string> {
  if (!password || password.length === 0) {
    throw new Error('Password cannot be empty')
  }

  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

  // Derive key from password
  const key = await deriveKey(password, salt)

  // Encrypt the data
  const plaintextBuffer = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    plaintextBuffer
  )

  // Combine salt, IV, and ciphertext
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length)

  // Convert to base64
  const base64 = btoa(String.fromCharCode(...combined))

  // Return with header
  return ENCRYPTION_HEADER + base64
}

/**
 * Decrypt data with a password
 * Expects format: HEADER|base64(salt|iv|ciphertext)
 */
export async function decrypt(encryptedData: string, password: string): Promise<string> {
  if (!password || password.length === 0) {
    throw new Error('Password cannot be empty')
  }

  // Check if data has encryption header
  if (!encryptedData.startsWith(ENCRYPTION_HEADER)) {
    throw new Error('Data is not encrypted or uses an unsupported format')
  }

  // Remove header and decode base64
  const base64 = encryptedData.substring(ENCRYPTION_HEADER.length)
  const combined = Uint8Array.from(atob(base64), c => c.charCodeAt(0))

  // Extract salt, IV, and ciphertext
  const salt = combined.slice(0, SALT_LENGTH)
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH)

  // Derive key from password
  const key = await deriveKey(password, salt)

  try {
    // Decrypt the data
    const plaintextBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      ciphertext
    )

    // Convert back to string
    return new TextDecoder().decode(plaintextBuffer)
  } catch (error) {
    throw new Error('Decryption failed. Incorrect password or corrupted data.')
  }
}

/**
 * Check if a string appears to be encrypted data
 */
export function isEncrypted(data: string): boolean {
  return data.startsWith(ENCRYPTION_HEADER)
}

