// SMTP da mesma conta IMAP (Gmail senha de app) - sem Resend/Brevo

import nodemailer from 'nodemailer'
import { decryptSecret } from './cryptoSecret.js'

export function createGmailTransporter(email, appPasswordPlain)
{
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: email,
      pass: String(appPasswordPlain).replace(/\s/g, ''),
    },
  })
}

export function imapPasswordFromRow(row)
{
  return decryptSecret(row?.app_password || '')
}

/**
 * Envia e-mail para o próprio endereço da conta conectada.
 * @returns {Promise<{ ok: true } | { ok: false, error: string, oauthRequired?: boolean }>}
 */
export async function sendMailViaImapAccount(row, { subject, text, html, to } = {})
{
  if (!row?.email || !row?.app_password)
  {
    return { ok: false, error: 'IMAP não configurado' }
  }

  let password
  try
  {
    password = imapPasswordFromRow(row)
  }
  catch (err)
  {
    return { ok: false, error: err?.message || 'Falha ao decifrar senha' }
  }

  const transporter = createGmailTransporter(row.email, password)
  const dest = to || row.email

  try
  {
    await transporter.sendMail({
      from: `"Simply-Life" <${row.email}>`,
      to: dest,
      subject: subject || 'Simply-Life',
      text: text || '',
      html: html || undefined,
    })
    return { ok: true }
  }
  catch (err)
  {
    const msg = err?.message || 'Falha SMTP'
    const oauthRequired = /535|534|username and password not accepted|application-specific|oauth/i.test(msg)
    return { ok: false, error: msg, oauthRequired }
  }
}
