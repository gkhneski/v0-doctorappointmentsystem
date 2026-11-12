import { pyFloat, pyRound } from "@/lib/anne/generation/pynum"

// Ölçüm analizi. Eski sistemdeki backend/generation/biometric_analyzer.py dosyasının
// (analyze_biometrics, estimate_face_ratios, generate_ai_parameters) satır satır karşılığıdır.
// Sabitler, eşikler ve yuvarlamalar DEĞİŞTİRİLMEZ: üretim yönergesi bu değerlerden kurulur.

/** Üretime giren ölçümler (mm). Eski sistemin BiometricInput alanlarından analizde kullanılanlar. */
export const BIOMETRIC_KEYS = [
  "bpd",
  "hc",
  "ac",
  "fl",
  "ofd",
  "nasal_bone",
  "iod",
  "fromen",
  "eye_diameter",
  "bioc_cap",
  "mouth_diameter",
  "upper_lip",
  "chin",
] as const
export type BiometricKey = (typeof BIOMETRIC_KEYS)[number]
export type Biometrics = Partial<Record<BiometricKey, number>>

export type Gender = "female" | "male"

export type HeadShapeCategory = "dolichocephalic" | "mesocephalic" | "brachycephalic" | "unknown"

export type FaceRatios = {
  face_width_ratio: number
  forehead_ratio: number
  chin_ratio: number
  nose_to_face: number
  eye_distance_ratio: number
  eye_size_ratio: number
  mouth_ratio: number
  upper_lip_ratio: number
}

export type BiometricAnalysis = {
  input_measurements: Record<BiometricKey, number>
  calculated_indices: { cephalic_index?: number }
  calculated_ratios: { hc_ac_ratio?: number; fl_hc_ratio?: number; fl_ac_ratio?: number }
  head_shape: { category: HeadShapeCategory; description: string }
  face_proportions: { nasal_to_bpd?: number; iod_to_bpd?: number }
  estimated_face_ratios: FaceRatios
}

export type AiParameters = {
  pregnancy_week: number
  gender: Gender
  gender_tr: "kız" | "erkek"
  measurements: Record<BiometricKey, number>
  head_shape: { category: HeadShapeCategory; description: string }
  ratios: BiometricAnalysis["calculated_ratios"]
  face_proportions: FaceRatios
}

/** CI = BPD / OFD * 100. OFD yoksa BPD'den tahmin edilir (ortalama oran 1.265). */
export function calculateCephalicIndex(bpd: number, ofd: number): number {
  if (ofd <= 0) ofd = bpd * 1.265
  if (ofd > 0) return pyRound((bpd / ofd) * 100, 2)
  return 0
}

export function getHeadShape(ci: number): Exclude<HeadShapeCategory, "unknown"> {
  if (ci < 75) return "dolichocephalic"
  if (ci > 80) return "brachycephalic"
  return "mesocephalic"
}

const HEAD_SHAPE_DESCRIPTIONS: Record<Exclude<HeadShapeCategory, "unknown">, string> = {
  dolichocephalic: "Uzun/oval baş şekli",
  mesocephalic: "Normal baş şekli",
  brachycephalic: "Yuvarlak/geniş baş şekli",
}

/** Gerçek ölçüm varsa onu kullanır, yoksa baş şeklinden tahmin eder. */
export function estimateFaceRatios(input: {
  bpd: number
  headShape: HeadShapeCategory
  nasal_bone: number
  iod: number
  fromen: number
  eye_diameter: number
  bioc_cap: number
  mouth_diameter: number
  upper_lip: number
  chin: number
}): FaceRatios {
  const { bpd, headShape } = input
  const byShape = (dolicho: number, brachy: number, other: number) =>
    headShape === "dolichocephalic" ? dolicho : headShape === "brachycephalic" ? brachy : other

  return {
    face_width_ratio: input.bioc_cap > 0 && bpd > 0 ? pyRound(input.bioc_cap / bpd, 3) : byShape(0.85, 0.95, 0.9),
    forehead_ratio: input.fromen > 0 && bpd > 0 ? pyRound(input.fromen / bpd, 3) : byShape(0.36, 0.3, 0.33),
    chin_ratio: input.chin > 0 && bpd > 0 ? pyRound(input.chin / bpd, 3) : byShape(0.28, 0.24, 0.26),
    nose_to_face: input.nasal_bone > 0 && bpd > 0 ? pyRound(input.nasal_bone / (bpd * 0.6), 3) : 0.14,
    eye_distance_ratio: input.iod > 0 && bpd > 0 ? pyRound(input.iod / bpd, 3) : 0.31,
    eye_size_ratio: input.eye_diameter > 0 && bpd > 0 ? pyRound(input.eye_diameter / bpd, 3) : 0.12,
    mouth_ratio: input.mouth_diameter > 0 && bpd > 0 ? pyRound(input.mouth_diameter / bpd, 3) : 0.22,
    upper_lip_ratio: input.upper_lip > 0 && bpd > 0 ? pyRound(input.upper_lip / bpd, 3) : 0.08,
  }
}

export function analyzeBiometrics(data: Record<string, unknown>): BiometricAnalysis {
  const bpd = pyFloat(data.bpd)
  const hc = pyFloat(data.hc)
  const ac = pyFloat(data.ac)
  const fl = pyFloat(data.fl)
  let ofd = pyFloat(data.ofd)
  const nasal_bone = pyFloat(data.nasal_bone)
  const iod = pyFloat(data.iod)
  const fromen = pyFloat(data.fromen)
  const eye_diameter = pyFloat(data.eye_diameter)
  const bioc_cap = pyFloat(data.bioc_cap)
  const mouth_diameter = pyFloat(data.mouth_diameter)
  const upper_lip = pyFloat(data.upper_lip)
  const chin = pyFloat(data.chin)

  // OFD yoksa tahmin et
  if (ofd <= 0 && bpd > 0) ofd = bpd * 1.265

  const result: BiometricAnalysis = {
    input_measurements: {
      bpd,
      hc,
      ac,
      fl,
      ofd: pyRound(ofd, 1),
      nasal_bone,
      iod,
      fromen,
      eye_diameter,
      bioc_cap,
      mouth_diameter,
      upper_lip,
      chin,
    },
    calculated_indices: {},
    calculated_ratios: {},
    head_shape: { category: "unknown", description: "" },
    face_proportions: {},
    estimated_face_ratios: undefined as unknown as FaceRatios,
  }

  if (bpd > 0 && ofd > 0) {
    const ci = calculateCephalicIndex(bpd, ofd)
    const shape = getHeadShape(ci)
    result.calculated_indices.cephalic_index = ci
    result.head_shape = { category: shape, description: HEAD_SHAPE_DESCRIPTIONS[shape] }
  }

  if (hc > 0 && ac > 0) result.calculated_ratios.hc_ac_ratio = pyRound(hc / ac, 3)
  if (fl > 0 && hc > 0) result.calculated_ratios.fl_hc_ratio = pyRound(fl / hc, 3)
  if (fl > 0 && ac > 0) result.calculated_ratios.fl_ac_ratio = pyRound(fl / ac, 3)

  if (nasal_bone > 0 && bpd > 0) result.face_proportions.nasal_to_bpd = pyRound(nasal_bone / bpd, 3)
  if (iod > 0 && bpd > 0) result.face_proportions.iod_to_bpd = pyRound(iod / bpd, 3)

  result.estimated_face_ratios = estimateFaceRatios({
    bpd,
    headShape: result.head_shape.category,
    nasal_bone,
    iod,
    fromen,
    eye_diameter,
    bioc_cap,
    mouth_diameter,
    upper_lip,
    chin,
  })

  return result
}

export function generateAiParameters(analysis: BiometricAnalysis, pregnancyWeek: number, gender: Gender): AiParameters {
  return {
    pregnancy_week: pregnancyWeek,
    gender,
    gender_tr: gender === "female" ? "kız" : "erkek",
    measurements: analysis.input_measurements,
    head_shape: analysis.head_shape,
    ratios: analysis.calculated_ratios,
    face_proportions: analysis.estimated_face_ratios,
  }
}

// ---- Kâğıttan okunan değerlerin üretim ölçümlerine aktarılması ----
//
// Eski sistemin hızlı muayene sihirbazı (PatientDetailPage.jsx, handleOcrFileSelect) okunan
// değerlerden yalnızca şu 13 alanı alıyor ve "eye" alanını "eye_diameter" olarak gönderiyordu.

const OCR_TO_BIOMETRIC: Record<string, BiometricKey> = {
  bpd: "bpd",
  hc: "hc",
  ac: "ac",
  fl: "fl",
  ofd: "ofd",
  fromen: "fromen",
  nasal_bone: "nasal_bone",
  iod: "iod",
  eye: "eye_diameter",
  bioc_cap: "bioc_cap",
  mouth_diameter: "mouth_diameter",
  upper_lip: "upper_lip",
  chin: "chin",
}

/**
 * Bir kâğıdın okunan değerlerini öncekilerin üstüne yazar: boş olmayan her yeni değer
 * eskisinin yerine geçer (iki fotoğraf çekildiğinde son okunan geçerlidir).
 */
export function mergeOcrResult(previous: Biometrics, ocr: Record<string, unknown>): { biometrics: Biometrics; filled: number } {
  const biometrics: Biometrics = { ...previous }
  let filled = 0
  for (const [ocrKey, key] of Object.entries(OCR_TO_BIOMETRIC)) {
    const raw = ocr[ocrKey]
    if (raw === null || raw === undefined) continue
    biometrics[key] = pyFloat(typeof raw === "number" ? raw : String(raw))
    filled++
  }
  return { biometrics, filled }
}

/** Veritabanından gelen kaydı güvenli biçimde ölçüm nesnesine çevirir. */
export function readBiometrics(value: unknown): Biometrics {
  const out: Biometrics = {}
  if (!value || typeof value !== "object") return out
  for (const key of BIOMETRIC_KEYS) {
    const n = (value as Record<string, unknown>)[key]
    if (typeof n === "number" && Number.isFinite(n) && n >= 0 && n < 10000) out[key] = n
  }
  return out
}
