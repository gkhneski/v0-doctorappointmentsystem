import { convertToModelMessages, streamText, tool, UIMessage } from "ai"
import { z } from "zod"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export const maxDuration = 30

const APPOINTMENT_TYPES = [
  { id: "asilama-tup-bebek", label: "Aşılama / Tüp Bebek" },
  { id: "ayrintili-fetal-ultrason", label: "Ayrıntılı Fetal Ultrason" },
  { id: "gebelik-takibi", label: "Gebelik Takibi" },
  { id: "gebelik-istemi-infertilite", label: "Gebelik İstemi / İnfertilite" },
  { id: "jinekolojik-muayene", label: "Jinekolojik Muayene" },
  { id: "kontrol-takip", label: "Kontrol / Takip" },
]

const SYSTEM_PROMPT = `Sen Prof. Dr. Eray Çalışkan'ın muayenehanesinin sıcak kalpli ve profesyonel dijital asistanısın.
Türkçe konuş. Hasta Bulgarca yazarsa Bulgarca cevap ver.

--- KONUŞMA AKIŞI ---

ADIM 1 — İSİM AL:
İlk mesajında sadece şunu yaz (başka hiçbir şey ekleme):
"Merhaba, hoş geldiniz. Ben Prof. Dr. Eray Çalışkan'ın dijital asistanıyım. Size daha iyi yardımcı olabilmem için adınızı ve soyadınızı öğrenebilir miyim?"

ADIM 2 — KIŞISEL KARŞILAMA VE MENU (ZORUNLU):
Hasta ismini yazdiktan sonra ASLA direkt randevu sorma. Oncelikle asagidaki menuyu AYNEN goster:

"Merhaba [Ad Soyad], tanistigimiza memnun oldum!

Size su konularda yardimci olabilirim:

1. Tup Bebek (IVF) hakkinda bilgi - surec, basari oranlari, uygun yas
2. Gebelik takibi ve ayrintili fetal ultrason
3. Gebelik istemi ve infertilite tedavisi  
4. Asilama (IUI) ve jinekolojik muayene
5. Muayene ucretleri ve paket bilgileri
6. Online randevu almak

Hangi konuda bilgi almak istersiniz? Numara ile veya yazarak belirtebilirsiniz."

ONEMLI: Bu menuyu MUTLAKA goster. Hasta secim yapana kadar randevu tiplerini SORMA.

ADIM 3 — HASTA SECIMINI BEKLE:
Hasta menudan bir numara veya konu secene kadar BEKLE. Secim yapilinca:

- 1, 2, 3, 4 veya 5 sectiyse: Bilgi ver, sonra "Bu konuda randevu almak ister misiniz?" sor
- 6 sectiyse veya "randevu" dediyse: "Hangi hizmet icin randevu almak istersiniz?" sor, cevabi al, SONRA getAvailableSlots cagir

ASLA hasta secim yapmadan randevu tiplerini listeleme veya randevu akisina baslama.

--- BİLGİ BANKASI ---

ÜCRETLER:
- İlk Muayene: 500 TL
- Kontrol Muayenesi: 300 TL
- Ayrıntılı Fetal Ultrason: 600 TL
- Tüp Bebek (IVF) Danışmanlığı: 1.000 TL
- Gebelik Takibi Paketi (6 seans): 1.500 TL

IVF (TÜP BEBEK) BİLGİLERİ:
- Ne zaman yapılır: Adet görmüş her kadın için uygun, ideal yaş 20-35
- Başarı oranları: 20-35 yaş %60-70 | 35-40 yaş %40-50 | 40+ yaş %20-30
- Süreç: Yumurta stimülasyonu (10-14 gün) → Toplama → Döllenme → Transfer
- Erkek faktörü: Sperm analizi ile değerlendirilir
- İlk adım: Muayene ve hormon testleri
- Kaç deneme: Genellikle 2-3 siklus önerilir

DOKTOR BİLGİSİ:
- Prof. Dr. Eray Çalışkan — Kadın Hastalıkları, Doğum ve Perinatoloji Uzmanı
- 2.000+ başarılı tüp bebek tedavisi
- 1.000+ uluslararası bilimsel yayın ve kitap
- Hacettepe Üniversitesi mezunu, Kocaeli Üniversitesi'nde Profesör
- Bahçeşehir Üniversitesi Tıp Fakültesi Dekan Yardımcısı

HİZMETLER:
- Tüp Bebek (IVF): Kocaeli'nin en deneyimli IVF merkezi
- Gebelik Takibi: Riskli gebelik takibi ve perinatoloji
- Ayrıntılı Fetal Ultrason: 20-22. hafta anomali taraması
- Aşılama (IUI): Daha az invazif infertilite tedavisi
- Jinekolojik Muayene: Genel kadın sağlığı

BULGARISTAN HASTALARI:
- Evet, Bulgaristan'dan hasta kabul edilmektedir
- Kırcali-Bulgaristan kökenli doktor olması sebebiyle özel ilgi
- Tercüman desteği önceden ayarlanabilir
- Uluslararası ödeme yöntemleri kabul edilir
- Bulgarca iletişim mümkündür

ACİL İLETİŞİM:
- Sekreter: 0531 080 47 20

--- KURALLAR ---
- Asla tıbbi teşhis veya tedavi tavsiyesi verme
- Tıbbi sorularda: "Bu soruyu doktorumuz muayenede en doğru şekilde yanıtlayacaktır"
- Cevapları kısa, net ve samimi tut
- Her zaman randevuya yönlendirmeyi ihmal etme`

export async function POST(req: Request) {
  const body = await req.json()
  const messages: UIMessage[] = body.messages ?? []

  const supabase = createServiceRoleClient()

  const { data: doctors } = await supabase.from("doctors").select("id").limit(1)
  const doctorId = doctors?.[0]?.id

  const result = streamText({
    model: "google/gemini-2.0-flash",
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: {
      getAvailableSlots: tool({
        description: "Belirtilen randevu tipi için müsait slotları getirir",
        inputSchema: z.object({
          appointmentType: z.string().describe("Randevu tipi ID'si"),
          limit: z.number().default(5).describe("Kaç slot gösterilsin"),
        }),
        execute: async ({ limit }) => {
          const today = new Date().toISOString().split("T")[0]
          const threeWeeksLater = new Date()
          threeWeeksLater.setDate(threeWeeksLater.getDate() + 21)
          const endDate = threeWeeksLater.toISOString().split("T")[0]

          const { data: schedules } = await supabase
            .from("doctor_schedules")
            .select("*")
            .eq("is_available", true)
            .gte("schedule_date", today)
            .lte("schedule_date", endDate)
            .order("schedule_date")
            .order("start_time")

          const { data: existingAppts } = await supabase
            .from("appointments")
            .select("appointment_date, appointment_time")
            .gte("appointment_date", today)
            .neq("status", "cancelled")

          const takenSlots = new Set(
            (existingAppts || []).map((a) => `${a.appointment_date}_${a.appointment_time}`)
          )

          const availableSlots: { date: string; time: string; label: string }[] = []

          for (const schedule of schedules || []) {
            if (availableSlots.length >= limit) break
            const start = new Date(`2000-01-01T${schedule.start_time}`)
            const end = new Date(`2000-01-01T${schedule.end_time}`)
            while (start <= end && availableSlots.length < limit) {
              const timeStr = start.toTimeString().slice(0, 5)
              const key = `${schedule.schedule_date}_${timeStr}:00`
              if (!takenSlots.has(key)) {
                const dateObj = new Date(schedule.schedule_date)
                const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"]
                const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]
                const label = `${days[dateObj.getDay()]}, ${dateObj.getDate()} ${months[dateObj.getMonth()]} - ${timeStr}`
                availableSlots.push({ date: schedule.schedule_date, time: timeStr, label })
              }
              start.setMinutes(start.getMinutes() + 15)
            }
          }

          return { slots: availableSlots, doctorId }
        },
      }),

      selectSlot: tool({
        description: "Hasta bir slot seçtiğinde, seçilen bilgileri kaydet ve forma yönlendir",
        inputSchema: z.object({
          date: z.string().describe("Randevu tarihi YYYY-MM-DD"),
          time: z.string().describe("Randevu saati HH:MM"),
          appointmentTypeId: z.string().describe("Randevu tipi ID"),
          appointmentTypeLabel: z.string().describe("Randevu tipi adı"),
          patientName: z.string().describe("Hastanın adı soyadı"),
        }),
        execute: async ({ date, time, appointmentTypeId, appointmentTypeLabel, patientName }) => {
          return {
            selected: true,
            date,
            time,
            appointmentTypeId,
            appointmentTypeLabel,
            patientName,
            doctorId,
            message: "Slot seçildi. Hasta formu doldurmak için yönlendirilebilir.",
          }
        },
      }),
    },
  })

  return result.toUIMessageStreamResponse()
}
