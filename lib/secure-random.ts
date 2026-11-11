import { randomBytes, randomInt } from "node:crypto"

/** SMS ile gönderilen 6 haneli doğrulama kodu (tahmin edilemez üreteçle). */
export function generateVerificationCode(): string {
  return randomInt(100000, 1000000).toString()
}

/** Adrese konabilen, tahmin edilemez 32 karakterlik bağlantı belirteci. */
export function generateUrlToken(): string {
  return randomBytes(24).toString("base64url")
}
