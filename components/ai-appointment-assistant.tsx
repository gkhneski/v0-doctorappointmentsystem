"use client"

import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, MessageCircle, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function AIAppointmentAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/ai-randevu",
    id: "appointment-assistant",
    initialMessages: [], // Start empty, will trigger first assistant message below
  })

  // Trigger initial assistant greeting when chat opens
  const hasInitialMessage = messages.length > 0
  const shouldShowInitialPrompt = isOpen && !hasInitialMessage && !isLoading

  return (
    <>
      {/* Chat Widget Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all"
          aria-label="Open appointment assistant"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-96 h-[600px] flex flex-col shadow-2xl rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Randevu Asistanı</h3>
              <p className="text-xs opacity-90">Prof. Dr. Eray Çalışkan</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-blue-700 rounded"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {shouldShowInitialPrompt && (
              <div className="text-center text-gray-500 text-sm py-8">
                <p className="font-semibold text-gray-700 mb-2">Hoş geldiniz! 👋</p>
                <p className="mb-4">Ben Prof. Dr. Eray Çalışkan'ın randevu asistanıyım.</p>
                <p className="text-xs text-gray-600">Yazı yazmaya başlayın ve size yardımcı olacağım...</p>
              </div>
            )}

            {messages.length === 0 && !shouldShowInitialPrompt && (
              <div className="text-center text-gray-500 text-sm py-8">
                <p className="font-semibold text-gray-700 mb-2">Merhaba! 👋</p>
                <p>Randevu almak veya sormak istediğiniz bir şey var mı?</p>
                <p className="mt-2 text-xs">Ücretler, IVF zamanı, muayene süreleri hakkında sorunuz olabilir.</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-xs px-4 py-2 rounded-lg text-sm",
                    message.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white border border-gray-200 text-gray-900 rounded-bl-none"
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSubmit}
            className="border-t p-3 bg-white flex gap-2"
          >
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Sorunuzu yazın..."
              disabled={isLoading}
              className="text-sm"
            />
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Card>
      )}
    </>
  )
}
