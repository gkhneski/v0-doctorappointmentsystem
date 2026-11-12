import { describe, expect, it } from "vitest"
import { EMPTY_SELECTION, applyItemsBlock, buildItemsBlock, toggleItem } from "@/lib/sms-item-list"

const NAME = "Ayşe Yılmaz"

describe("buildItemsBlock", () => {
  it("is empty when nothing is selected", () => {
    expect(buildItemsBlock(EMPTY_SELECTION)).toBe("")
  })

  it("lists each selected category under its heading", () => {
    const block = buildItemsBlock({ medication: ["Aspirin"], vitamin: [], test: ["İkili Test", "Tam Kan"] })
    expect(block).toBe("İlaçlarınız:\n- Aspirin\n\nTahlil ve evraklarınız:\n- İkili Test\n- Tam Kan")
  })
})

describe("toggleItem", () => {
  it("adds then removes an item", () => {
    const once = toggleItem(EMPTY_SELECTION, "medication", "Aspirin")
    expect(once.medication).toEqual(["Aspirin"])
    expect(toggleItem(once, "medication", "Aspirin").medication).toEqual([])
  })
})

describe("applyItemsBlock", () => {
  const template = `Sayın ${NAME}, evraklarınız eksik. Lütfen en kısa sürede tamamlayınız.`

  it("adds the items after a template that was chosen first", () => {
    const block = buildItemsBlock({ ...EMPTY_SELECTION, test: ["İkili Test"] })
    expect(applyItemsBlock(template, "", block, NAME)).toBe(`${template}\n\nTahlil ve evraklarınız:\n- İkili Test`)
  })

  it("starts with a greeting when the message is empty", () => {
    const block = buildItemsBlock({ ...EMPTY_SELECTION, medication: ["Aspirin"] })
    expect(applyItemsBlock("", "", block, NAME)).toBe(`Merhaba ${NAME},\n\nİlaçlarınız:\n- Aspirin`)
  })

  it("replaces the previous block instead of repeating it", () => {
    const first = buildItemsBlock({ ...EMPTY_SELECTION, medication: ["Aspirin"] })
    const second = buildItemsBlock({ ...EMPTY_SELECTION, medication: ["Aspirin", "Demir Tablet"] })
    const message = applyItemsBlock(template, "", first, NAME)
    const updated = applyItemsBlock(message, first, second, NAME)
    expect(updated).toBe(`${template}\n\nİlaçlarınız:\n- Aspirin\n- Demir Tablet`)
  })

  it("removes the block and a bare greeting when everything is unticked", () => {
    const block = buildItemsBlock({ ...EMPTY_SELECTION, medication: ["Aspirin"] })
    const message = applyItemsBlock("", "", block, NAME)
    expect(applyItemsBlock(message, block, "", NAME)).toBe("")
    expect(applyItemsBlock(applyItemsBlock(template, "", block, NAME), block, "", NAME)).toBe(template)
  })

  it("keeps text typed by staff", () => {
    const block = buildItemsBlock({ ...EMPTY_SELECTION, medication: ["Aspirin"] })
    const typed = `${applyItemsBlock(template, "", block, NAME)}\n\nYarın 10:00`
    const next = buildItemsBlock({ ...EMPTY_SELECTION, medication: ["Aspirin"], vitamin: ["Omega-3"] })
    const updated = applyItemsBlock(typed, block, next, NAME)
    expect(updated).toContain("Yarın 10:00")
    expect(updated).toContain("- Omega-3")
    expect(updated.match(/- Aspirin/g)).toHaveLength(1)
  })

  it("does not treat dollar signs in item names as replacement patterns", () => {
    const block = buildItemsBlock({ ...EMPTY_SELECTION, medication: ["A $& B"] })
    const message = applyItemsBlock(template, "", block, NAME)
    expect(applyItemsBlock(message, block, "", NAME)).toBe(template)
  })
})
