import type { SupabaseClient } from "@supabase/supabase-js"
import { normalizePhone, phoneVariants } from "@/lib/phone"

export type ResolvePatientInput = {
  tc_no: string
  full_name: string
  phone: string
  date_of_birth?: string | null
  kvkk_approved?: boolean
}

/** Kod doğrulanana kadar bekletilen hasta kaydı değişikliği. */
export type PendingPatient = {
  tc_no?: string
  full_name?: string
  phone?: string
  date_of_birth?: string
  kvkk_approved?: boolean
}

export type ResolvedPatient = { id: string; created: boolean; pending: PendingPatient | null }

/** appointment_forms.form_data içinde bekleyen değişikliğin tutulduğu anahtar. */
export const PENDING_PATIENT_KEY = "_pending_patient"

// Bir kaydın TC'si "geçici" mi? (boş, null veya TEMP_ önekli)
function isTempTc(tc: string | null | undefined): boolean {
  if (!tc) return true
  const t = tc.trim()
  return t === "" || t.startsWith("TEMP_")
}

/**
 * Hasta kaydını çözer ve duplicate oluşmasını engeller.
 *
 * Sıra:
 * 1. Gerçek TC ile eşleşen kayıt varsa onu kullan/güncelle.
 * 2. Yoksa aynı telefonlu GEÇİCİ kaydı bul (quick-add ile açılmış, TC'si boş/TEMP_)
 *    ve onu gerçek TC'ye "yükselt" — yeni kayıt açma.
 * 3. Hiçbiri yoksa yeni kayıt oluştur (yarış durumunda TC çakışmasını tolere et).
 *
 * Aynı telefonu paylaşan ama FARKLI gerçek TC'li kayıtlara dokunmaz (aile üyeleri).
 *
 * `defer: true` (herkese açık yol): MEVCUT bir kayda dokunulmaz; yapılacak değişiklik
 * `pending` olarak döner ve SMS kodu doğrulanınca `applyPendingPatient` ile uygulanır.
 * Böylece TC'yi ya da telefonu bilen biri, kod olmadan başkasının kaydını değiştiremez.
 */
export async function resolvePatient(
  supabase: SupabaseClient,
  input: ResolvePatientInput,
  options: { defer: boolean },
): Promise<ResolvedPatient> {
  const tc = (input.tc_no || "").trim()
  const phone = normalizePhone(input.phone) || (input.phone || "").trim()
  const hasRealTc = !isTempTc(tc)

  // 1. Gerçek TC ile eşleşme
  if (hasRealTc) {
    const { data: byTc } = await supabase
      .from("patients")
      .select("id")
      .eq("tc_no", tc)
      .order("created_at", { ascending: true })
      .limit(1)

    const foundByTc = Array.isArray(byTc) ? byTc[0] : byTc
    if (foundByTc) {
      const updatePayload: PendingPatient = {
        full_name: input.full_name,
        phone,
      }
      if (input.kvkk_approved !== undefined) updatePayload.kvkk_approved = input.kvkk_approved
      if (input.date_of_birth) updatePayload.date_of_birth = input.date_of_birth
      if (options.defer) return { id: foundByTc.id, created: false, pending: updatePayload }
      await supabase.from("patients").update(updatePayload).eq("id", foundByTc.id)
      return { id: foundByTc.id, created: false, pending: null }
    }

    // 2. TC bulunamadı — aynı telefonlu GEÇİCİ kaydı ara ve yükselt
    if (normalizePhone(phone)) {
      const { data: byPhone } = await supabase
        .from("patients")
        .select("id, tc_no")
        .in("phone", phoneVariants(phone))
        .order("created_at", { ascending: true })
        .limit(10)

      const tempMatch = (byPhone || []).find((p) => isTempTc(p.tc_no))
      if (tempMatch) {
        const upgradePayload: PendingPatient = {
          tc_no: tc,
          full_name: input.full_name,
        }
        if (input.kvkk_approved !== undefined) upgradePayload.kvkk_approved = input.kvkk_approved
        if (input.date_of_birth) upgradePayload.date_of_birth = input.date_of_birth
        if (options.defer) return { id: tempMatch.id, created: false, pending: upgradePayload }
        const { error: upgradeError } = await supabase
          .from("patients")
          .update(upgradePayload)
          .eq("id", tempMatch.id)
        // Yükseltme başarısızsa (ör. TC benzersizlik yarışı) yeni kayda düş
        if (!upgradeError) return { id: tempMatch.id, created: false, pending: null }
      }
    }
  }

  // 3. Yeni kayıt oluştur
  const { data: newPatient, error: insertError } = await supabase
    .from("patients")
    .insert({
      tc_no: tc,
      full_name: input.full_name,
      phone,
      date_of_birth: input.date_of_birth || null,
      kvkk_approved: input.kvkk_approved ?? false,
    })
    .select("id")
    .single()

  if (insertError || !newPatient) {
    // Yarış durumu: TC benzersizlik çakışması — mevcut kaydı bul
    if (hasRealTc) {
      const { data: raced } = await supabase
        .from("patients")
        .select("id")
        .eq("tc_no", tc)
        .order("created_at", { ascending: true })
        .limit(1)
      if (raced && raced[0]) return { id: raced[0].id, created: false, pending: null }
    }
    throw insertError
  }

  return { id: newPatient.id, created: true, pending: null }
}

/** Personel yolları için: kaydı hemen günceller, yalnızca kimliği döner. */
export async function resolvePatientId(supabase: SupabaseClient, input: ResolvePatientInput): Promise<string> {
  return (await resolvePatient(supabase, input, { defer: false })).id
}

/**
 * SMS kodu doğrulandıktan sonra çağrılır: randevunun formunda bekleyen hasta değişikliği
 * varsa hastaya uygular ve formdan siler. Bekleyen yoksa hiçbir şey yapmaz. Hata fırlatmaz —
 * randevu onayı, kayıt güncellemesi yüzünden başarısız olmamalı.
 */
export async function applyPendingPatient(supabase: SupabaseClient, appointmentId: string): Promise<void> {
  try {
    const { data: forms } = await supabase
      .from("appointment_forms")
      .select("id, form_data")
      .eq("appointment_id", appointmentId)
      .limit(1)
    const form = forms?.[0]
    const raw = form?.form_data?.[PENDING_PATIENT_KEY]
    if (!form || !raw || typeof raw !== "object") return

    const { data: appointments } = await supabase
      .from("appointments")
      .select("patient_id")
      .eq("id", appointmentId)
      .limit(1)
    const patientId = appointments?.[0]?.patient_id

    // Yalnızca bilinen alanlar, doğru tipte
    const changes: PendingPatient = {}
    for (const key of ["tc_no", "full_name", "phone", "date_of_birth"] as const) {
      if (typeof raw[key] === "string" && raw[key]) changes[key] = raw[key]
    }
    if (typeof raw.kvkk_approved === "boolean") changes.kvkk_approved = raw.kvkk_approved

    if (patientId && Object.keys(changes).length > 0) {
      const { error } = await supabase.from("patients").update(changes).eq("id", patientId)
      if (error) {
        // Degisiklik kaybolmasin: anahtar formda kalir (personel ekraninda gorunmez, kayitta durur).
        console.error("Pending patient update failed:", error.message)
        return
      }
    }

    const { [PENDING_PATIENT_KEY]: _removed, ...rest } = form.form_data
    await supabase.from("appointment_forms").update({ form_data: rest }).eq("id", form.id)
  } catch (err: any) {
    console.error("Pending patient apply error:", err?.message)
  }
}
