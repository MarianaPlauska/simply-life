// AES-256-GCM para segredos em repouso (senha de app IMAP)
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'

const PREFIX = 'enc:v1:'

function keyFromEnv()
{
  const raw = (process.env.ENCRYPTION_KEY || '').trim()
  if (!raw)
  {
    return null
  }

  if (/^[0-9a-fA-F]{64}$/.test(raw))
  {
    return Buffer.from(raw, 'hex')
  }

  try
  {
    const b64 = Buffer.from(raw, 'base64')
    if (b64.length === 32) return b64
  }
  catch { /* fallback scrypt */ }

  return scryptSync(raw, 'simply-life-imap', 32)
}

export function isEncryptionConfigured()
{
  return Boolean(keyFromEnv())
}

export function isEncryptedSecret(value)
{
  return typeof value === 'string' && value.startsWith(PREFIX)
}

export function encryptSecret(plain)
{
  const key = keyFromEnv()
  if (!key)
  {
    throw new Error('ENCRYPTION_KEY ausente - não gravo senha em texto puro')
  }

  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return PREFIX + Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decryptSecret(stored)
{
  if (!stored) return ''
  if (!isEncryptedSecret(stored))
  {
    return stored
  }

  const key = keyFromEnv()
  if (!key)
  {
    throw new Error('ENCRYPTION_KEY ausente - não consigo ler a senha IMAP')
  }

  const buf = Buffer.from(stored.slice(PREFIX.length), 'base64')
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const data = buf.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}
