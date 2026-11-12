import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { sendSms } from "@/lib/sms"

const fetchMock = vi.fn()

function providerReply(body: unknown, status = 200) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), { status })
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal("fetch", fetchMock)
  vi.stubEnv("NETGSM_USER", "8501234567")
  vi.stubEnv("NETGSM_PASSWORD", "s3cr&t=pass")
  vi.stubEnv("NETGSM_HEADER", "KLINIK")
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe("sendSms", () => {
  it("şifreyi adres satırına değil yetki başlığına koyar", async () => {
    fetchMock.mockResolvedValue(providerReply({ code: "00", jobid: "123", description: "queued" }))
    await sendSms("0532 123 45 67", "Merhaba")

    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe("https://api.netgsm.com.tr/sms/rest/v2/send")
    expect(String(url)).not.toContain("?")
    expect(init.method).toBe("POST")
    expect(init.headers.Authorization).toBe(
      "Basic " + Buffer.from("8501234567:s3cr&t=pass").toString("base64"),
    )
    expect(init.body).not.toContain("s3cr")
  })

  it("numarayı 5XXXXXXXXX biçiminde, mesajı ve başlığı gövdede gönderir", async () => {
    fetchMock.mockResolvedValue(providerReply({ code: "00", jobid: "123" }))
    await sendSms("+90 532 123 45 67", "Satir 1\nSatir 2 & <b>")

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      msgheader: "KLINIK",
      messages: [{ msg: "Satir 1\nSatir 2 & <b>", no: "5321234567" }],
    })
  })

  it("başlık tanımlı değilse SAGLIK kullanır", async () => {
    vi.stubEnv("NETGSM_HEADER", "")
    fetchMock.mockResolvedValue(providerReply({ code: "00", jobid: "1" }))
    await sendSms("05321234567", "x")
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).msgheader).toBe("SAGLIK")
  })

  it("00 yanıtında gönderildi sayar ve iş numarasını kayda geçirir", async () => {
    fetchMock.mockResolvedValue(providerReply({ code: "00", jobid: "17377215", description: "queued" }))
    expect(await sendSms("05321234567", "x")).toEqual({ sent: true, code: "00", reference: "00 17377215" })
  })

  it("sağlayıcı reddederse gönderilmedi sayar ve kodu döndürür", async () => {
    fetchMock.mockResolvedValue(providerReply({ code: "30", jobid: null, description: "credentialError" }, 406))
    expect(await sendSms("05321234567", "x")).toEqual({ sent: false, code: "30", reference: "30 credentialError" })
  })

  it("anlaşılmayan yanıtta gönderilmedi sayar", async () => {
    fetchMock.mockResolvedValue(providerReply("<html>Bad Gateway</html>", 502))
    const result = await sendSms("05321234567", "x")
    expect(result.sent).toBe(false)
    expect(result.code).toBe("invalid_response")
  })

  it("giriş bilgileri yoksa sağlayıcıya hiç gitmez", async () => {
    vi.stubEnv("NETGSM_PASSWORD", "")
    expect(await sendSms("05321234567", "x")).toEqual({
      sent: false,
      code: "credentials_missing",
      reference: "credentials_missing",
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("telefon boşsa sağlayıcıya hiç gitmez", async () => {
    expect((await sendSms("", "x")).code).toBe("invalid_phone")
    expect((await sendSms(null, "x")).code).toBe("invalid_phone")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("TR cep olmayan numarayı rakamlarıyla gönderir (eski davranış)", async () => {
    fetchMock.mockResolvedValue(providerReply({ code: "00", jobid: "1" }))
    await sendSms("+49 151 234 56789", "x")
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).messages[0].no).toBe("4915123456789")
  })

  it("strictPhone ile TR cep olmayan numarayı reddeder", async () => {
    expect((await sendSms("+49 151 234 56789", "x", { strictPhone: true })).code).toBe("invalid_phone")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("ağ hatasında fırlatmaz, gönderilmedi döner ve şifreyi kayda yazmaz", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    fetchMock.mockRejectedValue(new Error("connect ETIMEDOUT"))
    expect(await sendSms("05321234567", "x")).toEqual({
      sent: false,
      code: "network_error",
      reference: "network_error",
    })
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain("s3cr")
  })
})
