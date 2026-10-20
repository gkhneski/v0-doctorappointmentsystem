export const PATIENT_LIST_COLUMNS =
  "id, full_name, tc_no, phone, date_of_birth, kvkk_approved, created_at, profile_photo_url, is_blacklisted, blacklist_reason"

// Supabase tek istekte en fazla 1000 satir dondurur (.range(0, 9999) olsa bile).
// Tum hastalari almak icin 1000'erli sayfalar halinde cekiyoruz.
const PAGE_SIZE = 1000

export async function fetchAllPatients(
  supabase: any,
  orderBy: { column: string; ascending: boolean } = { column: "created_at", ascending: false },
) {
  const all: any[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("patients")
      .select(PATIENT_LIST_COLUMNS)
      .order(orderBy.column, { ascending: orderBy.ascending })
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) return { data: all.length ? all : null, error }
    all.push(...(data || []))
    if (!data || data.length < PAGE_SIZE) break
  }
  return { data: all, error: null }
}
