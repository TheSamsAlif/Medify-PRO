"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Send, Mic, Bot, User, Loader2, Trash2, Sparkles, Square, Copy, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import type { ChatMessage } from "@/types"

const suggestions = [
  { text: "Napa Extra 500mg কি কাজ করে?" },
  { text: "ডায়াবেটিস রোগীর খাদ্য তালিকা" },
  { text: "amar jor bhut beshi, ki korbo?" },
  { text: "ওষুধ খেতে ভুলে গেলে কী করব?" },
]

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [streamingText, setStreamingText] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const streamingRef = useRef<number | null>(null)

  useEffect(() => {
    fetchHistory()
    return () => {
      if (streamingRef.current) clearInterval(streamingRef.current)
    }
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingText])

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/chat/history")
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch {
      // silent
    }
  }

  const typeResponse = (text: string) => {
    let index = 0
    setStreamingText("")
    streamingRef.current = window.setInterval(() => {
      if (index < text.length) {
        setStreamingText(text.slice(0, index + 1))
        index++
      } else {
        if (streamingRef.current) clearInterval(streamingRef.current)
        streamingRef.current = null
        const assistantMsg: ChatMessage = {
          id: Date.now().toString(),
          userId: "",
          role: "assistant",
          content: text,
          createdAt: new Date().toISOString(),
        }
        setMessages(prev => [...prev, assistantMsg])
        setStreamingText("")
      }
    }, 15)
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      userId: "",
      role: "user",
      content: input,
      createdAt: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMsg])
    const currentInput = input
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput }),
      })

      if (res.ok) {
        const data = await res.json()
        // Use typing animation for longer responses
        if (data.response && data.response.length > 50) {
          typeResponse(data.response)
        } else {
          const assistantMsg: ChatMessage = {
            id: Date.now().toString(),
            userId: "",
            role: "assistant",
            content: data.response,
            createdAt: new Date().toISOString(),
          }
          setMessages(prev => [...prev, assistantMsg])
        }
      } else if (res.status === 401) {
        toast.error("লগইন করুন")
        window.location.href = "/auth/login"
      } else {
        toast.error("AI রেসপন্স পেতে সমস্যা হয়েছে")
      }
    } catch {
      toast.error("AI সহায়ক কাজ করছে না")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const clearChat = async () => {
    try {
      await fetch("/api/chat/history", { method: "DELETE" })
      setMessages([])
      toast.success("চ্যাট ক্লিয়ার করা হয়েছে")
    } catch {
      toast.error("ক্লিয়ার করতে সমস্যা হয়েছে")
    }
  }

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("কপি করা হয়েছে")
  }

  const retryLast = () => {
    const lastUser = [...messages].reverse().find(m => m.role === "user")
    if (lastUser) {
      setInput(lastUser.content)
      setMessages(prev => prev.slice(0, -2))
    }
  }

  const toggleRecording = () => {
    if (!isRecording) {
      toast.error("ভয়েস ইনপুট শীঘ্রই আসছে")
      return
    }
  }

  const renderContent = (text: string) => {
    // Simple markdown-like rendering
    return text
      .split("\n")
      .map((line, i) => {
        if (line.startsWith("**") && line.endsWith("**")) {
          return <p key={i} className="font-bold text-sm mt-2 mb-1">{line.slice(2, -2)}</p>
        }
        if (line.startsWith("• ") || line.startsWith("- ")) {
          return <li key={i} className="text-sm ml-4 list-disc">{line.slice(2)}</li>
        }
        if (line.match(/^\d+\.\s/)) {
          return <li key={i} className="text-sm ml-4 list-decimal">{line.replace(/^\d+\.\s/, "")}</li>
        }
        if (!line.trim()) return <div key={i} className="h-2" />
        return <p key={i} className="text-sm leading-relaxed whitespace-pre-wrap">{line}</p>
      })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-[calc(100vh-8rem)] flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-[#F96801]/30">
            <Bot className="w-6 h-6 text-[#160500]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#EFF2F2]">AI স্বাস্থ্য সহায়ক</h2>
            <p className="text-sm text-[#A5ABB0]">Gemini AI · বাংলা/English/Banglish</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 border-[#F96801]/30 text-[#F96801]">
            <Sparkles className="w-3 h-3" />
            Gemini AI
          </Badge>
          {messages.length > 0 && (
            <>
              <Button variant="ghost" size="icon" onClick={retryLast} className="rounded-full text-[#A5ABB0] hover:text-[#25C2C3] hover:bg-white/[.06]" title="পুনরায় চেষ্টা">
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={clearChat} className="rounded-full text-[#A5ABB0] hover:text-[#DE1B2D] hover:bg-white/[.06]" title="চ্যাট ক্লিয়ার">
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <Card className="flex-1 flex flex-col border border-white/[.08] bg-[#0a0d16] backdrop-blur-xl overflow-hidden">
        <ScrollArea ref={scrollRef} className="flex-1 p-4 md:p-6">
          {messages.length === 0 && !streamingText ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <div className="w-20 h-20 rounded-3xl gradient-primary flex items-center justify-center mb-6 shadow-xl shadow-[#F96801]/30">
                <Bot className="w-10 h-10 text-[#160500]" />
              </div>
              <h3 className="text-xl font-bold text-[#EFF2F2] mb-2">আমি Medify AI</h3>
              <p className="text-[#A5ABB0] max-w-md mb-8">
                বাংলা, ইংরেজি বা বাংলিশ (Banglish) এ আপনার স্বাস্থ্য নিয়ে প্রশ্ন করুন।
              </p>
              <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(s.text)}
                    className="flex items-start gap-3 p-4 rounded-2xl bg-white/[.04] border border-white/[.08] hover:border-[#F96801]/30 transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#F96801]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4 text-[#F96801]" />
                    </div>
                    <p className="text-sm text-[#EFF2F2] text-left">{s.text}</p>
                  </button>
                ))}
              </div>
              <p className="mt-8 text-xs text-[#A5ABB0]/60 max-w-md">
                * শিক্ষামূলক তথ্য, ডাক্তারের বিকল্প নয়
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 group ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-[#160500]" />
                    </div>
                  )}
                  <div className="relative max-w-[85%] md:max-w-[70%]">
                    <div className={`rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-[#F96801] to-[#FF8A1E] text-[#160500] rounded-tr-sm"
                        : "bg-white/[.06] border border-white/[.08] text-[#EFF2F2] rounded-tl-sm"
                    }`}>
                      {renderContent(msg.content)}
                    </div>
                    {msg.role === "assistant" && (
                      <button
                        onClick={() => copyMessage(msg.content)}
                        className="absolute -bottom-5 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-[#A5ABB0] hover:text-[#EFF2F2]"
                        title="কপি"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-xl bg-[#F96801]/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-4 h-4 text-[#F96801]" />
                    </div>
                  )}
                </motion.div>
              ))}

              {streamingText && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-[#160500]" />
                  </div>
                  <div className="bg-white/[.06] border border-white/[.08] rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] md:max-w-[70%]">
                    <p className="text-sm text-[#EFF2F2] whitespace-pre-wrap">{streamingText}</p>
                    <span className="inline-block w-2 h-4 bg-[#F96801] animate-pulse ml-0.5" />
                  </div>
                </motion.div>
              )}

              {loading && !streamingText && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-[#160500]" />
                  </div>
                  <div className="bg-white/[.06] border border-white/[.08] rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-2 items-center">
                      <Loader2 className="w-4 h-4 animate-spin text-[#F96801]" />
                      <span className="text-sm text-[#A5ABB0]">ভাবছে...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-white/[.08] p-4 bg-[#0a0d16]">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="আপনার প্রশ্ন লিখুন... (Enter চাপুন পাঠাতে)"
                rows={1}
                className="w-full resize-none rounded-2xl border border-white/[.08] bg-white/[.04] px-4 py-3.5 text-sm text-[#EFF2F2] placeholder:text-[#A5ABB0] focus:outline-none focus:ring-2 focus:ring-[#F96801]/20 focus:border-[#F96801]/50 min-h-[48px] max-h-32"
                style={{ height: "auto" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = "auto"
                  target.style.height = Math.min(target.scrollHeight, 128) + "px"
                }}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleRecording}
              className={`rounded-full w-11 h-11 flex-shrink-0 ${isRecording ? "bg-[#DE1B2D] text-white animate-pulse" : "text-[#A5ABB0] hover:text-[#EFF2F2] hover:bg-white/[.06]"}`}
            >
              {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="rounded-full w-11 h-11 flex-shrink-0 gradient-primary text-[#160500] shadow-lg shadow-[#F96801]/20 disabled:opacity-50 disabled:cursor-not-allowed btn-shine"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
          <p className="text-[10px] text-[#A5ABB0]/60 mt-2 text-center">
            Medify AI শিক্ষামূলক তথ্য প্রদান করে, এটি লাইসেন্সপ্রাপ্ত ডাক্তারের পরামর্শের বিকল্প নয়।
          </p>
        </div>
      </Card>
    </motion.div>
  )
}
