import { describe, it, expect } from 'vitest'
import { encrypt, decrypt, isEncrypted } from '../encryption'

// Web Crypto API is available in Node 20+ which vitest uses
describe('encryption', () => {
  it('encrypt then decrypt returns original plaintext', async () => {
    const original = 'Hello, this is secret data!'
    const encrypted = await encrypt(original, 'mypassword123')
    const decrypted = await decrypt(encrypted, 'mypassword123')
    expect(decrypted).toBe(original)
  })

  it('encrypt then decrypt with complex JSON', async () => {
    const data = {
      people: [{ id: '1', name: 'Test Person' }],
      notes: 'Some important notes with "quotes" and special chars: <>&',
    }
    const json = JSON.stringify(data)
    const encrypted = await encrypt(json, 'complex-pass!@#$')
    const decrypted = await decrypt(encrypted, 'complex-pass!@#$')
    expect(JSON.parse(decrypted)).toEqual(data)
  })

  it('encrypt with empty password throws', async () => {
    await expect(encrypt('data', '')).rejects.toThrow('Password cannot be empty')
  })

  it('decrypt with empty password throws', async () => {
    await expect(decrypt('LEGACY_VAULT_ENCRYPTED_v1:abc', '')).rejects.toThrow('Password cannot be empty')
  })

  it('decrypt with wrong password throws', async () => {
    const encrypted = await encrypt('secret', 'correct-password')
    await expect(decrypt(encrypted, 'wrong-password')).rejects.toThrow('Decryption failed')
  })

  it('decrypt non-encrypted data throws', async () => {
    await expect(decrypt('{"plain":"json"}', 'pass')).rejects.toThrow('not encrypted or uses an unsupported format')
  })

  it('isEncrypted identifies encrypted data', async () => {
    const encrypted = await encrypt('test', 'password')
    expect(isEncrypted(encrypted)).toBe(true)
  })

  it('isEncrypted rejects plain data', () => {
    expect(isEncrypted('{"plain":"json"}')).toBe(false)
    expect(isEncrypted('')).toBe(false)
  })

  it('each encryption produces unique ciphertext', async () => {
    const a = await encrypt('same text', 'same-password')
    const b = await encrypt('same text', 'same-password')
    expect(a).not.toBe(b) // Different salt/IV each time
  })
})
