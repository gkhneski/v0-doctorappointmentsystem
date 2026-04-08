"use client"

import { useState, useEffect } from "react"
import { Sparkles, X, Bot } from "lucide-react"
import dynamic from "next/dynamic"

const AiRandevuChat = dynamic(() => import("./ai-randevu-chat"), { ssr: false })

// Rotating text around the button
const CIRCLE_TEXT = "NeoBreed ile Randevu Al  •  NeoBreed ile Randevu Al  •  "

function RotatingText() {
  const chars = CIRCLE_TEXT.split("")
  const total = chars.length
  const radius = 38 // px, distance from center
  return (
    <svg
      className="absolute inset-0 w-full h-full animate-spin-slow pointer-events-none"
      viewBox="0 0 120 120"
    >
      {chars.map((char, i) => {
        const angle = (i / total) * 360 - 90
        const rad = (angle * Math.PI) / 180
        const x = 60 + radius * Math.cos(rad)
        const y = 60 + radius * Math.sin(rad)
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="7.5"
            fill="white"
            fillOpacity="0.85"
            transform={`rotate(${angle + 90}, ${x}, ${y})`}
            className="font-medium tracking-wide"
          >
            {char}
          </text>
        )
      })}
    </svg>
  )
}

export default function AiStickyWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Chat panel */}
      <div
        className={`fixed bottom-28 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm shadow-2xl rounded-2xl border bg-background overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        style={{ height: isOpen ? "min(600px, calc(100vh - 130px))" : "0px" }}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-primary to-primary/80 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <Bot className="h-4 w-4 text-primary-foreground" />
              <span className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-60" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary-foreground leading-tight">Randevu Asistanı</p>
              <p className="text-[11px] text-primary-foreground/70 leading-tight">Yapay Zekayla Randevunuzu Birlikte Alalım</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-primary-foreground/70 hover:bg-white/20 hover:text-primary-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Chat content */}
        <div className="h-[calc(100%-56px)] overflow-hidden">
          {isOpen && <AiRandevuChat standalone />}
        </div>
      </div>

      {/* Sticky trigger button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full focus:outline-none group"
          aria-label="Yapay zeka randevu asistanı"
        >
          {/* Outer breathing ring 1 */}
          {!isOpen && (
            <span className="absolute inset-[-8px] rounded-full border-2 border-primary/30 animate-breathe" />
          )}
          {/* Outer breathing ring 2 */}
          {!isOpen && (
            <span className="absolute inset-[-16px] rounded-full border border-primary/15 animate-breathe [animation-delay:1s]" />
          )}

          {/* Rotating text ring - only when closed */}
          {!isOpen && (
            <span className="absolute inset-[-14px] rounded-full">
              <RotatingText />
            </span>
          )}

          {/* Gradient background button */}
          <span
            className={`relative flex h-[72px] w-[72px] items-center justify-center rounded-full shadow-xl transition-all duration-300
              ${isOpen
                ? "bg-slate-700 scale-90"
                : "bg-gradient-to-br from-primary via-primary to-cyan-500 group-hover:scale-110 group-active:scale-95 animate-float-btn"
              }
            `}
          >
            {/* Shine shimmer */}
            {!isOpen && (
              <span className="absolute inset-0 rounded-full overflow-hidden">
                <span className="absolute top-0 left-[-60%] h-full w-1/2 bg-white/20 skew-x-12 animate-shimmer" />
              </span>
            )}

            {isOpen ? (
              <X className="h-7 w-7 text-white relative z-10" />
            ) : (
              <Sparkles className="h-7 w-7 text-white relative z-10 animate-sparkle" />
            )}
          </span>
        </button>
      </div>
    </>
  )
}
