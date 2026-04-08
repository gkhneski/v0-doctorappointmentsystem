import { createClient } from "@/lib/supabase/client"

export type PregnancyEpisode = {
  id: string
  patient_id: string
  status: "active" | "closed"
  started_at: string | null
  conception_type: string | null
  sat_date: string | null
  edd_date: string | null
  et_date: string | null
  blood_group: string | null
  rh: string | null
  rh_incompatibility: boolean | null
  height_cm: number | null
  pre_pregnancy_weight: number | null
  bmi: number | null
  anamnesis: Record<string, any>
  important_notes: string | null
  created_at: string
  updated_at: string
}

export type PregnancyVisit = {
  id: string
  episode_id: string
  visit_date: string
  topic: string | null
  ga_weeks: number | null
  ga_days: number | null
  weight_kg: number | null
  bp_systolic: number | null
  bp_diastolic: number | null
  exam_notes: string | null
  usg_metrics: Record<string, any>
  medications: string[]
  tests: Record<string, any>
  procedures: Record<string, any>
  created_at: string
  updated_at: string
}

export type PregnancyOutcome = {
  episode_id: string
  result: string
  result_date: string | null
  delivery_week: number | null
  delivery_day: number | null
  delivery_type: string | null
  baby_count: number | null
  hospital: string | null
  delivery_doctor: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// Calculate gestational age from SAT date
export function calculateGA(satDate: string, targetDate: string = new Date().toISOString()) {
  const sat = new Date(satDate)
  const target = new Date(targetDate)
  const diffTime = target.getTime() - sat.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  const weeks = Math.floor(diffDays / 7)
  const days = diffDays % 7
  
  return { weeks, days, totalDays: diffDays }
}

// Calculate EDD from SAT (SAT + 280 days)
export function calculateEDD(satDate: string): string {
  const sat = new Date(satDate)
  sat.setDate(sat.getDate() + 280)
  return sat.toISOString().split("T")[0]
}

// Format GA for display
export function formatGA(weeks: number | null, days: number | null): string {
  if (weeks === null) return "-"
  if (days === null || days === 0) return `${weeks} hafta`
  return `${weeks}+${days} hafta`
}

// Get Supabase client (singleton)
export function getSupabaseClient() {
  return createClient()
}

// Fetch active pregnancy episode
export async function fetchActivePregnancy(patientId: string): Promise<PregnancyEpisode | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("pregnancy_episodes")
    .select("*")
    .eq("patient_id", patientId)
    .eq("status", "active")
    .maybeSingle()
  
  if (error) throw error
  return data
}

// Fetch pregnancy visits
export async function fetchPregnancyVisits(episodeId: string): Promise<PregnancyVisit[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("pregnancy_visits")
    .select("*")
    .eq("episode_id", episodeId)
    .order("visit_date", { ascending: false })
  
  if (error) throw error
  return data || []
}

// Fetch pregnancy outcome
export async function fetchPregnancyOutcome(episodeId: string): Promise<PregnancyOutcome | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("pregnancy_outcomes")
    .select("*")
    .eq("episode_id", episodeId)
    .maybeSingle()
  
  if (error) throw error
  return data
}

// Create pregnancy episode
export async function createPregnancyEpisode(
  patientId: string,
  data: Partial<PregnancyEpisode>
): Promise<PregnancyEpisode> {
  const supabase = getSupabaseClient()
  const { data: episode, error } = await supabase
    .from("pregnancy_episodes")
    .insert({
      patient_id: patientId,
      status: "active",
      anamnesis: {},
      ...data,
    })
    .select()
    .single()
  
  if (error) throw error
  return episode
}

// Update pregnancy episode
export async function updatePregnancyEpisode(
  episodeId: string,
  data: Partial<PregnancyEpisode>
): Promise<PregnancyEpisode> {
  const supabase = getSupabaseClient()
  const { data: episode, error } = await supabase
    .from("pregnancy_episodes")
    .update(data)
    .eq("id", episodeId)
    .select()
    .single()
  
  if (error) throw error
  return episode
}

// Create or update pregnancy visit
export async function upsertPregnancyVisit(
  visit: Partial<PregnancyVisit>
): Promise<PregnancyVisit> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("pregnancy_visits")
    .upsert(visit)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Delete pregnancy visit
export async function deletePregnancyVisit(visitId: string): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from("pregnancy_visits")
    .delete()
    .eq("id", visitId)
  
  if (error) throw error
}

// Create or update pregnancy outcome
export async function upsertPregnancyOutcome(
  outcome: Partial<PregnancyOutcome>
): Promise<PregnancyOutcome> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("pregnancy_outcomes")
    .upsert(outcome, { onConflict: "episode_id" })
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Close pregnancy (set status to closed)
export async function closePregnancy(episodeId: string): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from("pregnancy_episodes")
    .update({ status: "closed" })
    .eq("id", episodeId)
  
  if (error) throw error
}

// Fetch documents for a visit
export async function fetchVisitDocuments(visitId: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("patient_documents")
    .select("*")
    .eq("pregnancy_visit_id", visitId)
    .order("created_at", { ascending: false })
  
  if (error) throw error
  return data || []
}
