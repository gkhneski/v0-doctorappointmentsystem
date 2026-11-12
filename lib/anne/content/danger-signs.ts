import type { SourceKey } from "@/lib/anne/content/sources"

// Gebelikte tehlike işaretleri.
// Kaynak: Doğum Öncesi Bakım Yönetim Rehberi (2026), "Gebelikte tehlike işaretleri" listesi (13 madde).
// Ne yapılacağı: Gebe Okulu Eğitim Kitabı (2025) — herhangi biri olursa derhal sağlık kuruluşuna başvurulur.
// Madde sayısı ve kapsamı kaynakla aynıdır; tıbbi terimler gündelik dille yazılmıştır.
//
// Uygulama bu belirtileri değerlendirmez ve soru sormaz; yalnızca listeyi ve ne yapılacağını gösterir.

export const DANGER_SIGNS: readonly string[] = [
  "Şiddetli bulantı ve kusma",
  "Vajinal kanama (rengi ve miktarı ne olursa olsun)",
  "Havale ya da nöbet geçirme",
  "Şiddetli baş ağrısı",
  "Bulanık görme",
  "Ateş",
  "Günlük işlerinizi yapamayacak kadar halsizlik",
  "Karın ağrısı",
  "Nefes darlığı ya da sık nefes alma",
  "Yüzde, ellerde ve bacaklarda şişme",
  "Bebek hareketlerinin azalması",
  "Su gelmesi",
  "Nedeni bilinmeyen cilt kaşıntısı",
]

export const DANGER_ACTION =
  "Bunlardan herhangi biri olursa beklemeden bir sağlık kuruluşuna başvurun. Acil bir durumda 112 numarasını arayın."

export const DANGER_SOURCES: readonly SourceKey[] = ["dogumOncesi", "gebeOkulu"]
