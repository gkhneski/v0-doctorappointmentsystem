// "Beni böyle duyuyor": sesin karında nasıl duyulduğunu taklit eden süzgeç ve dosya yazımı.
// Annenin dokuları ve amniyon sıvısı tiz sesleri süzer; bebeğe yaklaşık 400–600 Hz'in altı ulaşır
// (lib/anne/content/sources.ts, rahimdeSes). Burada 500 Hz'lik alçak geçiren süzgeç kullanılır.
// Yalnızca saf işlevler ve Web Audio düğümleri; ses hiçbir yere gönderilmez.

export const WOMB_CUTOFF_HZ = 500
/** Süzgeç kapalıyken (dışarıdan duyulan hâl) kesim frekansı: duyulabilir aralığın üstü. */
export const OPEN_CUTOFF_HZ = 20000
export const MAX_RECORD_SECONDS = 15

/** Art arda iki süzgeç: tek süzgece göre tizleri daha keskin keser. */
export function wombFilters(context: BaseAudioContext, inside: boolean): [BiquadFilterNode, BiquadFilterNode] {
  const make = () => {
    const filter = context.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.value = inside ? WOMB_CUTOFF_HZ : OPEN_CUTOFF_HZ
    filter.Q.value = 0.7
    return filter
  }
  return [make(), make()]
}

/** Tek kanallı örnekleri 16 bit WAV dosyasına çevirir. */
export function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  const text = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i))
  }
  text(0, "RIFF")
  view.setUint32(4, 36 + samples.length * 2, true)
  text(8, "WAVE")
  text(12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  text(36, "data")
  view.setUint32(40, samples.length * 2, true)
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(44 + i * 2, Math.round(clamped * 32767), true)
  }
  return buffer
}

/** Kaydı karındaki hâliyle (süzülmüş) yeniden üretir ve WAV dosyası olarak verir. */
export async function renderWombWav(recording: AudioBuffer): Promise<Blob> {
  const offline = new OfflineAudioContext(1, recording.length, recording.sampleRate)
  const source = offline.createBufferSource()
  source.buffer = recording
  const [first, second] = wombFilters(offline, true)
  source.connect(first).connect(second).connect(offline.destination)
  source.start()
  const rendered = await offline.startRendering()
  return new Blob([encodeWav(rendered.getChannelData(0), rendered.sampleRate)], { type: "audio/wav" })
}
