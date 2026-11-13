import { NextResponse } from "next/server"
import { deleteAccount } from "@/lib/anne/auth"
import { resolvePregnancyStart, todayInIstanbul } from "@/lib/anne/pregnancy"
import { GENERATION_BUCKET } from "@/lib/anne/generation/limits"
import { DOCUMENT_BUCKET } from "@/lib/anne/document-types"
import { MOMENT_BUCKET } from "@/lib/anne/animation/moments"
import { ALBUM_BUCKET, clearSessionCookie, publicProfile, requireAppUser } from "@/lib/anne/server"

// Hastanın kendi hesabı. Her işlem oturumdaki hesabın kimliğiyle süzülür;
// istekten hesap kimliği okunmaz.

export async function GET(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response
  return NextResponse.json({ profile: publicProfile(gate.user) })
}

/** Başlangıç formu ve sonradan düzeltme: ad ve son adet / tahmini doğum tarihi. */
export async function PUT(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 })
  }

  const rawName = typeof body.displayName === "string" ? body.displayName.trim() : ""
  if (rawName.length > 60) {
    return NextResponse.json({ error: "Ad en fazla 60 karakter olabilir." }, { status: 400 })
  }

  const start = resolvePregnancyStart({ lmp: body.lmp, dueDate: body.dueDate }, todayInIstanbul())
  if (!start.ok) return NextResponse.json({ error: start.error }, { status: 400 })

  const { data, error } = await gate.db
    .from("app_users")
    .update({
      display_name: rawName || null,
      lmp_date: start.lmp,
      due_date: start.dueDate,
      due_date_source: start.source,
      onboarded_at: gate.user.onboarded_at ?? new Date().toISOString(),
    })
    .eq("id", gate.user.id)
    .select("id")

  if (error || !data || data.length === 0) {
    return NextResponse.json({ error: "Kaydedilemedi. Lütfen yeniden deneyin." }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    profile: publicProfile({
      ...gate.user,
      display_name: rawName || null,
      lmp_date: start.lmp,
      due_date: start.dueDate,
      due_date_source: start.source,
      onboarded_at: gate.user.onboarded_at ?? new Date().toISOString(),
    }),
  })
}

/** Hesabı kalıcı olarak siler (mağaza kuralı ve KVKK). */
export async function DELETE(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response

  // Fotoğraf dosyaları veritabanı zincirinin dışında durur; önce onlar silinir.
  const { data: photos } = await gate.db.from("app_photos").select("storage_path").eq("user_id", gate.user.id)
  const paths = (photos ?? []).map((p) => p.storage_path)
  if (paths.length > 0) {
    const removal = await gate.db.storage.from(ALBUM_BUCKET).remove(paths)
    if (removal.error) {
      return NextResponse.json({ error: "Hesap silinemedi. Lütfen yeniden deneyin." }, { status: 500 })
    }
  }

  // Üretilen bebek yüzü resimleri ayrı bir depoda durur; onlar da silinir.
  const { data: generations } = await gate.db.from("app_generations").select("storage_path").eq("user_id", gate.user.id)
  const generated = (generations ?? []).map((g) => g.storage_path).filter((path): path is string => typeof path === "string")
  if (generated.length > 0) {
    const removal = await gate.db.storage.from(GENERATION_BUCKET).remove(generated)
    if (removal.error) {
      return NextResponse.json({ error: "Hesap silinemedi. Lütfen yeniden deneyin." }, { status: 500 })
    }
  }

  // Bebek yüzü canlandırmaları (videolar) da silinir.
  const { data: moments } = await gate.db.from("app_moments").select("storage_path").eq("user_id", gate.user.id)
  const momentPaths = (moments ?? []).map((m) => m.storage_path).filter((p): p is string => typeof p === "string")
  if (momentPaths.length > 0) {
    const removal = await gate.db.storage.from(MOMENT_BUCKET).remove(momentPaths)
    if (removal.error) {
      return NextResponse.json({ error: "Hesap silinemedi. Lütfen yeniden deneyin." }, { status: 500 })
    }
  }

  // Yüklenen belgeler (tahlil, rapor) de hesapla birlikte silinir.
  const { data: documents } = await gate.db.from("app_documents").select("storage_path").eq("user_id", gate.user.id)
  const documentPaths = (documents ?? []).map((d) => d.storage_path)
  if (documentPaths.length > 0) {
    const removal = await gate.db.storage.from(DOCUMENT_BUCKET).remove(documentPaths)
    if (removal.error) {
      return NextResponse.json({ error: "Hesap silinemedi. Lütfen yeniden deneyin." }, { status: 500 })
    }
  }

  if (!(await deleteAccount(gate.db, gate.user))) {
    return NextResponse.json({ error: "Hesap silinemedi. Lütfen yeniden deneyin." }, { status: 500 })
  }
  const response = NextResponse.json({ ok: true })
  clearSessionCookie(response)
  return response
}
