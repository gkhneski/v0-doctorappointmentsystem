import { dateOfWeekStart } from "@/lib/anne/pregnancy"
import type { SourceKey } from "@/lib/anne/content/sources"

// Sağlık Bakanlığı'nın gebelik izlem takvimi: izlemler, taramalar, destekler, aşılar.
// Kaynak: Doğum Öncesi Bakım Yönetim Rehberi (2026). 2018 baskısındaki üçüncü izlem aralığı
// (24–28. hafta) 2026'da 28–32. hafta olarak değişti; burada 2026 baskısı esas alınır.
//
// Bu liste genel bilgidir, kişiye özel plan değildir: hangi testin yapılacağına, hangi desteğin
// hangi dozda kullanılacağına hastanın doktoru karar verir. Metinler bunu açıkça söyler.
//
// DURUM: Dr. Eray'ın onayı bekleniyor (yalnızca deneme kullanıcıları görüyor).

export type ScheduleKind = "izlem" | "tarama" | "destek" | "asi"

export type ScheduleItem = {
  id: string
  kind: ScheduleKind
  title: string
  /** Kaynaktaki ifadeyle hafta aralığı. */
  when: string
  /** Aralığın başladığı hafta (tamamlanan hafta). */
  fromWeek: number
  /** Aralığın bittiği hafta; ucu açıksa (doğuma kadar) null. */
  toWeek: number | null
  text: string
  source: SourceKey
}

export const KIND_LABEL: Record<ScheduleKind, string> = {
  izlem: "İzlem",
  tarama: "Tarama",
  destek: "Destek",
  asi: "Aşı",
}

export const SCHEDULE: readonly ScheduleItem[] = [
  {
    id: "izlem-1",
    kind: "izlem",
    title: "Birinci izlem",
    when: "14. haftaya kadar",
    fromWeek: 0,
    toWeek: 14,
    text: "Öykünüz alınır, muayene yapılır; kan ve idrar tahlilleri ile kan grubu istenir. Tarama testleri, destekler ve aşılar hakkında bilgi verilir.",
    source: "dogumOncesi",
  },
  {
    id: "folik-asit",
    kind: "destek",
    title: "Folik asit",
    when: "12. haftaya kadar",
    fromWeek: 0,
    toWeek: 12,
    text: "Rehbere göre folik asit desteği gebelikten önce başlar ve 12. haftaya kadar sürer. Dozu doktorunuz belirler.",
    source: "dogumOncesi",
  },
  {
    id: "kombine-test",
    kind: "tarama",
    title: "Kombine test ve ense saydamlığı ölçümü",
    when: "11–14. haftalar arasında",
    fromWeek: 11,
    toWeek: 14,
    text: "Ultrasonla ense saydamlığı ölçümü ve kan testinden oluşan tarama. Yaptırıp yaptırmamak sizin kararınızdır; doktorunuz bilgi verir.",
    source: "dogumOncesi",
  },
  {
    id: "d-vitamini",
    kind: "destek",
    title: "D vitamini",
    when: "12. haftadan itibaren",
    fromWeek: 12,
    toWeek: null,
    text: "Bakanlık programında gebelere 12. haftadan itibaren günde tek doz 1200 IU D vitamini önerilir; destek doğumdan sonra da sürer. Kullanımına doktorunuz karar verir.",
    source: "dogumOncesi",
  },
  {
    id: "demir",
    kind: "destek",
    title: "Demir",
    when: "16. haftadan itibaren",
    fromWeek: 16,
    toWeek: null,
    text: "Bakanlık programında kansızlığı olmayan gebelere 16. haftadan itibaren günde 40–60 mg demir desteği önerilir; destek doğumdan sonra üç ay daha sürer. Kansızlık varsa doz farklıdır; doktorunuz belirler.",
    source: "dogumOncesi",
  },
  {
    id: "uclu-dortlu-test",
    kind: "tarama",
    title: "Üçlü ya da dörtlü test",
    when: "16–20. haftalar arasında",
    fromWeek: 16,
    toWeek: 20,
    text: "Yalnızca kombine test yapılmadıysa gündeme gelir.",
    source: "dogumOncesi",
  },
  {
    id: "izlem-2",
    kind: "izlem",
    title: "İkinci izlem",
    when: "18–24. haftalar arasında",
    fromWeek: 18,
    toWeek: 24,
    text: "Muayene ve kilo takibi yapılır; idrar tahlili ve kan sayımı yinelenir. Ağız ve diş sağlığı konuşulur.",
    source: "dogumOncesi",
  },
  {
    id: "anomali-taramasi",
    kind: "tarama",
    title: "Ayrıntılı ultrason (fetal anomali taraması)",
    when: "18–24. haftalar arasında",
    fromWeek: 18,
    toWeek: 24,
    text: "Bebeğin organlarının ultrasonla ayrıntılı incelendiği tarama.",
    source: "dogumOncesi",
  },
  {
    id: "tetanoz",
    kind: "asi",
    title: "Tetanos aşısı",
    when: "18–32. haftalar arasında",
    fromWeek: 18,
    toWeek: 32,
    text: "Kaç doz yapılacağı aşı kaydınıza göre belirlenir. Kaydı olmayanlarda ilk doz 18–24., ikinci doz 28–32. haftalar arasında yapılır. Aşı kartınızı izleme götürün.",
    source: "dogumOncesi",
  },
  {
    id: "seker-taramasi",
    kind: "tarama",
    title: "Şeker yükleme testi",
    when: "24–28. haftalar arasında",
    fromWeek: 24,
    toWeek: 28,
    text: "Gebelik şekeri taraması. Risk durumunuza göre daha erken de istenebilir.",
    source: "dogumOncesi",
  },
  {
    id: "izlem-3",
    kind: "izlem",
    title: "Üçüncü izlem",
    when: "28–32. haftalar arasında",
    fromWeek: 28,
    toWeek: 32,
    text: "Muayene yapılır; idrar tahlili, idrar kültürü ve kan sayımı istenir. Doğum, doğumun yapılacağı yer ve emzirme konuşulur. Kan uyuşmazlığı varsa ilgili test 28. haftada yinelenir.",
    source: "dogumOncesi",
  },
  {
    id: "tansiyon",
    kind: "izlem",
    title: "Haftalık tansiyon ölçümü",
    when: "32. haftadan itibaren",
    fromWeek: 32,
    toWeek: null,
    text: "Rehber, 32. haftadan doğuma kadar haftada bir tansiyon ölçtürmenizi ve değer 130/80 mmHg üzerindeyse doktora başvurmanızı önerir.",
    source: "dogumOncesi",
  },
  {
    id: "izlem-4",
    kind: "izlem",
    title: "Dördüncü izlem",
    when: "36–38. haftalar arasında",
    fromWeek: 36,
    toWeek: 38,
    text: "Ultrasonla bebeğin duruşu, plasentanın yeri ve suyu değerlendirilir; idrar tahlili ve kan sayımı istenir. Doğumun başladığını gösteren belirtiler anlatılır.",
    source: "dogumOncesi",
  },
]

/** Hafta aralığı olmayan, mevsime bağlı öneri. */
export const SEASONAL_NOTE = {
  title: "Grip aşısı",
  text: "Rehber, grip mevsiminde (Eylül–Nisan) gebelere grip aşısı önerir.",
  source: "dogumOncesi" as SourceKey,
}

export const SCHEDULE_INTRO =
  "Sağlık Bakanlığı her gebenin en az dört kez izlenmesini önerir. Doktorunuz sizi daha sık görebilir; sizin programınızı doktorunuz belirler."

export type ScheduleStatus = "past" | "now" | "next"

export type DatedScheduleItem = ScheduleItem & {
  status: ScheduleStatus
  /** Aralığın yaklaşık başlangıç günü (YYYY-AA-GG). */
  fromDate: string
  /** Aralığın yaklaşık bitiş günü; ucu açıksa null. */
  toDate: string | null
}

/** Bir maddenin, verilen (tamamlanan) haftaya göre durumu. */
export function statusAt(item: Pick<ScheduleItem, "fromWeek" | "toWeek">, week: number): ScheduleStatus {
  if (week < item.fromWeek) return "next"
  if (item.toWeek !== null && week >= item.toWeek) return "past"
  return "now"
}

/**
 * Takvimi hastanın son adet tarihine göre yaklaşık günlere çevirir.
 * Sıra: önce şimdi geçerli olanlar, sonra sıradakiler, en sonda geçmişte kalanlar.
 */
export function personalSchedule(lmp: string, week: number): DatedScheduleItem[] {
  const order: Record<ScheduleStatus, number> = { now: 0, next: 1, past: 2 }
  return SCHEDULE.map((item, index) => ({
    ...item,
    status: statusAt(item, week),
    fromDate: dateOfWeekStart(lmp, item.fromWeek),
    toDate: item.toWeek === null ? null : dateOfWeekStart(lmp, item.toWeek),
    index,
  }))
    .sort((a, b) => order[a.status] - order[b.status] || a.fromWeek - b.fromWeek || a.index - b.index)
    .map(({ index: _index, ...item }) => item)
}
