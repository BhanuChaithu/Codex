import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Send, Sparkles, Copy, Check, 
  Bot, ShieldAlert, Code, Cpu
} from 'lucide-react'
import toast from 'react-hot-toast'

interface AIChatPanelProps {
  isOpen: boolean
  onClose: () => void
}

interface Message {
  id: string
  sender: 'user' | 'agent'
  text: string
  codeSnippet?: string
  timestamp: string
}

export default function AIChatPanel({ isOpen, onClose }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'agent',
      text: 'Hello! I am your Codex Detective AI Software Engineer. How can I assist you with bug fixes, code reviews, or architecture audits today?',
      timestamp: 'Just now'
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input
    if (!textToSend.trim()) return

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    if (!customText) setInput('')
    setIsTyping(true)

    setTimeout(() => {
      let aiText = "I've analyzed your request across your project repository structure."
      let snippet: string | undefined = undefined

      if (textToSend.toLowerCase().includes('security') || textToSend.toLowerCase().includes('vulnerability')) {
        aiText = "I found a potential SQL injection vulnerability in your database query handler. Here is the recommended parameterized fix:"
        snippet = `// Refactored Async Query Handler\nasync function getSecureUser(userId: number) {\n  const result = await db.execute(\n    select(User).where(User.id == userId)\n  );\n  return result.scalar_one_or_none();\n}`
      } else if (textToSend.toLowerCase().includes('test')) {
        aiText = "Here is a generated pytest suite with 100% boundary assertion coverage:"
        snippet = `@pytest.mark.asyncio\nasync def test_user_authentication():\n    response = await client.post('/api/v1/auth/login', json={\n        'email': 'test@codex.ai',\n        'password': 'Password123!'\n    })\n    assert response.status_code == 200\n    assert 'access_token' in response.json()`
      } else {
        aiText = "Based on multi-agent static analysis, your codebase maintains a 96% security score with minor performance optimization opportunities in database query indexing."
      }

      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: aiText,
        codeSnippet: snippet,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }

      setMessages(prev => [...prev, agentMsg])
      setIsTyping(false)
    }, 1200)
  }

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    toast.success('Code snippet copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const promptChips = [
    { label: 'Scan Security Vulnerabilities', icon: ShieldAlert },
    { label: 'Generate pytest Unit Suite', icon: Code },
    { label: 'Optimize Async Performance', icon: Cpu },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] glass-panel border-l border-white/15 bg-zinc-950/90 z-50 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-purple-500/20">
                  <Sparkles className="h-5 w-5 text-white animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-sm text-white">Cursor AI Assistant</h3>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400 font-semibold border border-emerald-500/30">
                      GPT-4o / Gemini 1.5
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Context-Aware Multi-Agent Workspace</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02] flex items-center space-x-2 overflow-x-auto no-scrollbar">
              {promptChips.map((chip, idx) => {
                const ChipIcon = chip.icon
                return (
                  <button
                    key={idx}
                    onClick={() => handleSend(chip.label)}
                    className="flex-shrink-0 flex items-center space-x-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-purple-300 transition-all"
                  >
                    <ChipIcon className="h-3 w-3 text-purple-400" />
                    <span>{chip.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-[10px] font-medium text-zinc-500">{msg.timestamp}</span>
                    <span className="text-[11px] font-semibold text-zinc-300">
                      {msg.sender === 'user' ? 'You' : 'Codex AI'}
                    </span>
                  </div>
                  <div
                    className={`max-w-[90%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                        : 'glass-card border border-white/10 text-zinc-200'
                    }`}
                  >
                    <p>{msg.text}</p>
                    {msg.codeSnippet && (
                      <div className="mt-3 rounded-xl bg-zinc-900 border border-white/10 p-3 relative font-mono text-[11px] text-emerald-300 overflow-x-auto">
                        <button
                          onClick={() => copyCode(msg.codeSnippet!, msg.id)}
                          className="absolute top-2 right-2 flex items-center space-x-1 rounded bg-white/10 px-2 py-0.5 text-[10px] text-zinc-300 hover:bg-white/20 transition-colors"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        <pre>{msg.codeSnippet}</pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center space-x-2 glass-card p-3 rounded-2xl w-32 text-xs text-purple-300 border border-purple-500/20">
                  <Bot className="h-4 w-4 animate-bounce text-purple-400" />
                  <span>Thinking...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-white/10 bg-zinc-950">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSend()
                }}
                className="flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask AI to refactor code, find bugs, or write tests..."
                  className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-purple-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 transition-transform shadow-lg shadow-purple-500/20"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
