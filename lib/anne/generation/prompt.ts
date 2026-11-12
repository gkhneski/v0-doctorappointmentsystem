import type { AiParameters } from "@/lib/anne/generation/biometrics"
import { pyFixed, pyPercent0 } from "@/lib/anne/generation/pynum"

// KİLİTLİ ÜRETİM YÖNERGESİ.
//
// Eski sistemdeki backend/generation/ultrasound_4k.py dosyasının build_scientific_prompt
// işlevi ve iki sistem mesajının harfi harfine karşılığıdır. Bu metinler DEĞİŞTİRİLMEZ:
// üretilen görüntünün eski sistemle aynı çıkması buna bağlıdır. tests/anne/generation
// altındaki sınama, burada kurulan metni eski Python kodunun ürettiği metinle karşılaştırır.

const f1 = (x: number) => pyFixed(x, 1)
const f2 = (x: number) => pyFixed(x, 2)

export function buildScientificPrompt(params: AiParameters): string {
  const week = params.pregnancy_week
  const gender = params.gender
  const genderTr = gender === "female" ? "kız" : "erkek"

  const headShapeDesc = params.head_shape.description
  const headShapeCat = params.head_shape.category

  const face = params.face_proportions
  const faceWidthRatio = face.face_width_ratio
  const foreheadRatio = face.forehead_ratio
  const chinRatio = face.chin_ratio
  const noseToFace = face.nose_to_face
  const eyeDistance = face.eye_distance_ratio
  const eyeSize = face.eye_size_ratio
  const mouthRatio = face.mouth_ratio
  const upperLipRatio = face.upper_lip_ratio

  const m = params.measurements
  const bpd = m.bpd
  const hc = m.hc
  const nasalBone = m.nasal_bone
  const iodVal = m.iod
  const fromenVal = m.fromen
  const chinVal = m.chin
  const eyeVal = m.eye_diameter
  const mouthVal = m.mouth_diameter
  const lipVal = m.upper_lip
  const biocVal = m.bioc_cap

  let faceShapeDesc: string
  let foreheadDesc: string
  let chinDesc: string
  if (headShapeCat === "dolichocephalic") {
    faceShapeDesc = "uzun ve dar yüz yapısı, oval baş şekli"
    foreheadDesc = fromenVal > 0 ? `uzun alın ${f1(fromenVal)}mm (oran: ${f2(foreheadRatio)})` : `uzun alın (oran: ${f2(foreheadRatio)})`
    chinDesc = chinVal > 0 ? `ince çene ${f1(chinVal)}mm (oran: ${f2(chinRatio)})` : `ince ve uzun çene (oran: ${f2(chinRatio)})`
  } else if (headShapeCat === "brachycephalic") {
    faceShapeDesc = "geniş ve yuvarlak yüz yapısı"
    foreheadDesc = fromenVal > 0 ? `geniş alın ${f1(fromenVal)}mm (oran: ${f2(foreheadRatio)})` : `kısa ve geniş alın (oran: ${f2(foreheadRatio)})`
    chinDesc = chinVal > 0 ? `yuvarlak çene ${f1(chinVal)}mm (oran: ${f2(chinRatio)})` : `kısa ve yuvarlak çene (oran: ${f2(chinRatio)})`
  } else {
    faceShapeDesc = "dengeli ve orantılı yüz yapısı"
    foreheadDesc = fromenVal > 0 ? `alın ${f1(fromenVal)}mm (oran: ${f2(foreheadRatio)})` : `normal orantılı alın (oran: ${f2(foreheadRatio)})`
    chinDesc = chinVal > 0 ? `çene ${f1(chinVal)}mm (oran: ${f2(chinRatio)})` : `normal orantılı çene (oran: ${f2(chinRatio)})`
  }

  const noseDesc = nasalBone > 0 ? `burun uzunluğu ${f1(nasalBone)}mm` : "ortalama burun"
  const eyeDesc = iodVal > 0 ? `göz arası mesafe ${f1(iodVal)}mm, göz çapı ${f1(eyeVal)}mm` : "ortalama göz mesafesi"
  const mouthDesc = mouthVal > 0 ? `ağız genişliği ${f1(mouthVal)}mm, üst dudak ${f1(lipVal)}mm` : "ortalama ağız"
  const faceWDesc =
    biocVal > 0 ? `yüz genişliği ${f1(biocVal)}mm (BPD'nin ${pyPercent0(faceWidthRatio)}'si)` : `yüz genişlik oranı ${f2(faceWidthRatio)}`

  const genderFeatures =
    gender === "female" ? "yumuşak ve yuvarlak hatlar, ince kaşlar, küçük burun" : "daha belirgin hatlar, geniş alın, güçlü çene hattı"

  let devStage: string
  if (week < 20) devStage = "erken gelişim aşaması, ince ve yumuşak yüz hatları"
  else if (week < 28) devStage = "orta gelişim, yüz özellikleri belirginleşiyor"
  else if (week < 34) devStage = "ileri gelişim, yanaklarda yağ birikimi başlıyor"
  else devStage = "tam gelişim, dolgun yanaklar ve belirgin yüz hatları"

  return `Transform this 3D/4D ultrasound image into a CLEAN, FRONTAL VIEW of the baby's face.

## CRITICAL VIEW REQUIREMENT - STRICTLY FRONTAL
You MUST generate the baby face as a COMPLETELY FRONTAL (straight-on) view.
- The face MUST be looking DIRECTLY at the camera/viewer
- BOTH eyes must be GENTLY CLOSED (fetuses have closed eyes in the womb - this is critical for realism)
- The nose must be centered, pointing straight at the viewer
- The mouth/lips must be centered and symmetrical
- ZERO profile angle - absolutely NO side view
- Even if the input ultrasound shows a SIDE/PROFILE view, you MUST reconstruct the face as FRONTAL
- Imagine rotating the baby's face to look straight at you, then render it
- The eyelids must be smooth and naturally closed - NO open eyes

## BABY INFORMATION
- Gestational Age: ${week} weeks
- Gender: ${genderTr.toUpperCase()}
- Development Stage: ${devStage}

## HEAD AND FACE STRUCTURE (FROM BIOMETRIC DATA)
- Head Shape: ${headShapeDesc} (${headShapeCat})
- BPD: ${f1(bpd)}mm, HC: ${f1(hc)}mm
- Face Structure: ${faceShapeDesc}

## FACIAL PROPORTIONS (use these to guide the frontal face)
- Face width ratio: ${f2(faceWidthRatio)} - ${faceWDesc}
- Forehead ratio: ${f2(foreheadRatio)} - ${foreheadDesc}
- Chin ratio: ${f2(chinRatio)} - ${chinDesc}
- Nose/face ratio: ${f2(noseToFace)} - ${noseDesc}
- Eye distance ratio: ${f2(eyeDistance)} - ${eyeDesc}
- Eye size ratio: ${f2(eyeSize)}
- Mouth width ratio: ${f2(mouthRatio)} - ${mouthDesc}
- Upper lip ratio: ${f2(upperLipRatio)}

## GENDER FEATURES
${genderFeatures}

## ENHANCEMENT RULES
1. Output MUST be a FRONTAL face view - directly facing the viewer
2. The baby's eyes MUST be GENTLY CLOSED (natural fetal state in the womb)
3. Keep the 3D ultrasound texture and appearance (warm orange/amber tones)
4. AGGRESSIVELY clean up noise, blur, and artifacts
5. SHARPEN and clarify all facial features
6. Find ALL dark patches, shadow voids, black spots and FILL with matching skin texture
7. Dark holes near ears, cheeks, chin, forehead must be filled with natural fetal skin/tissue
8. NO dark spots or voids on or near the baby's face
9. Seamlessly blend repaired areas with surrounding tissue
10. DO NOT make it photorealistic - keep the 3D ultrasound look
11. Use the biometric data to guide proportions of the frontal face
12. Remove machine UI elements
13. Background should be dark/black

ABSOLUTE RULE: The output MUST show the baby's face from a STRAIGHT FRONTAL angle. Eyes GENTLY CLOSED. This is NON-NEGOTIABLE.`
}

/** Birincil sağlayıcıya (Google) yönergeden önce eklenen sistem mesajı. */
export const SYSTEM_MESSAGE = `You are an advanced ultrasound image enhancer that generates FRONTAL VIEW baby faces from ultrasound images.

ABSOLUTE RULES - NEVER BREAK:
1. The output MUST show the baby's face from a STRAIGHT-ON FRONTAL angle
2. The baby's eyes MUST be GENTLY CLOSED (natural fetal state - fetuses keep eyes closed in the womb)
3. The nose, mouth, and chin must be centered and symmetrical
4. Even if the input shows a side/profile view, reconstruct the face as FRONTAL
5. Keep warm orange/amber 3D ultrasound color tones and texture
6. REMOVE all noise, artifacts, and blur - make it clean and sharp
7. FILL any dark patches or voids with natural-looking fetal skin texture
8. DO NOT make it photorealistic - keep the 3D ultrasound appearance
9. Remove machine UI elements
10. Use biometric data to guide facial proportions`

/** Yedek sağlayıcıya (Replicate) yönergeden önce eklenen sistem mesajı. */
export const REPLICATE_SYSTEM_MESSAGE =
  "You are an advanced ultrasound image enhancer that generates FRONTAL VIEW baby faces " +
  "from ultrasound images. Keep warm orange/amber 3D ultrasound color tones and texture, " +
  "DO NOT make it photorealistic, keep the 3D ultrasound appearance. The baby's eyes MUST " +
  "be GENTLY CLOSED. The face MUST be a STRAIGHT-ON FRONTAL view."

export function fullGeminiPrompt(params: AiParameters): string {
  return SYSTEM_MESSAGE + "\n\n" + buildScientificPrompt(params)
}

export function fullReplicatePrompt(params: AiParameters): string {
  return REPLICATE_SYSTEM_MESSAGE + "\n\n" + buildScientificPrompt(params)
}
