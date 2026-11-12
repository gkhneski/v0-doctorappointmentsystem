// Hastanın yüklediği fotoğrafın ortak denetimi (ölçüm kâğıdı ve ultrason görüntüsü).
// Tarayıcı fotoğrafı eski sistemdeki gibi en çok 2000 piksel genişliğe küçültüp JPEG'e çevirir;
// sunucu yalnızca gerçekten JPEG olanı ve sınırın altındakini kabul eder.

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024

export type UploadCheck = { ok: true; bytes: Buffer } | { ok: false; error: string }

export async function readJpegUpload(file: unknown): Promise<UploadCheck> {
  if (!(file instanceof Blob)) return { ok: false, error: "Geçersiz istek." }
  if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "Fotoğraf çok büyük. Lütfen yeniden çekmeyi dene." }
  }
  const bytes = Buffer.from(await file.arrayBuffer())
  if (!(bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)) {
    return { ok: false, error: "Bu dosya bir fotoğraf değil." }
  }
  return { ok: true, bytes }
}
