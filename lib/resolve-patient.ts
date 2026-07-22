import type { SupabaseClient } from "@supabase/supabase-js"

export type ResolvePatientInput = {
  tc_no: string
  full_name: string
  phone: string
  date_of_birth?: string | null
  kvkk_approved?: boolean
}

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
 */
export async function resolvePatientId(
  supabase: SupabaseClient,
  input: ResolvePatientInput,
): Promise<string> {
  const tc = (input.tc_no || "").trim()
  const phone = (input.phone || "").trim()
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
      const updatePayload: Record<string, string | boolean> = {
        full_name: input.full_name,
        phone,
      }
      if (input.kvkk_approved !== undefined) updatePayload.kvkk_approved = input.kvkk_approved
      if (input.date_of_birth) updatePayload.date_of_birth = input.date_of_birth
      await supabase.from("patients").update(updatePayload).eq("id", foundByTc.id)
      return foundByTc.id
    }

    // 2. TC bulunamadı — aynı telefonlu GEÇİCİ kaydı ara ve yükselt
    if (phone && phone !== "0000000000") {
      const { data: byPhone } = await supabase
        .from("patients")
        .select("id, tc_no")
        .eq("phone", phone)
        .order("created_at", { ascending: true })
        .limit(10)

      const tempMatch = (byPhone || []).find((p) => isTempTc(p.tc_no))
      if (tempMatch) {
        const upgradePayload: Record<string, string | boolean> = {
          tc_no: tc,
          full_name: input.full_name,
        }
        if (input.kvkk_approved !== undefined) upgradePayload.kvkk_approved = input.kvkk_approved
        if (input.date_of_birth) upgradePayload.date_of_birth = input.date_of_birth
        const { error: upgradeError } = await supabase
          .from("patients")
          .update(upgradePayload)
          .eq("id", tempMatch.id)
        // Yükseltme başarısızsa (ör. TC benzersizlik yarışı) yeni kayda düş
        if (!upgradeError) return tempMatch.id
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
      if (raced && raced[0]) return raced[0].id
    }
    throw insertError
  }

  return newPatient.id
}
