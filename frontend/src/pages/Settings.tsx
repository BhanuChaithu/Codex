import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Save, Key, User, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import AIChatPanel from '../components/AIChatPanel'
import GlassCard from '../components/GlassCard'
import MouseGlow from '../components/MouseGlow'

export default function Settings() {
  const [openaiKey, setOpenaiKey] = useState('')
  const [geminiKey, setGeminiKey] = useState('')
  const [profileName, setProfileName] = useState('')
  const [profileEmail, setProfileEmail] = useState('')
  const [aiChatOpen, setAiChatOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setOpenaiKey(localStorage.getItem('openai_key') || '')
    setGeminiKey(localStorage.getItem('gemini_key') || '')
    setProfileName(localStorage.getItem('full_name') || 'Lead Engineer')
    setProfileEmail(localStorage.getItem('user_email') || 'engineer@codex.ai')
  }, [])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('openai_key', openaiKey)
    localStorage.setItem('gemini_key', geminiKey)
    toast.success('AI Provider keys & settings saved successfully!')
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-white relative selection:bg-purple-500 selection:text-white">
      <MouseGlow />
      <Navbar onOpenAIChat={() => setAiChatOpen(true)} />
      <AIChatPanel isOpen={aiChatOpen} onClose={() => setAiChatOpen(false)} />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 min-w-0 p-6 lg:p-10 max-w-4xl mx-auto space-y-8">
          
          <div className="flex items-center space-x-4 border-b border-white/10 pb-6">
            <Link
              to="/dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-white transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">System Settings</h1>
              <p className="text-xs text-zinc-400">Configure AI providers, LLM API keys, and workspace preferences.</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            
            <GlassCard glowColor="purple">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
                <User className="h-4 w-4 text-purple-400" />
                <span>Developer Profile</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    disabled
                    value={profileName}
                    className="w-full glass-input px-4 py-2.5 text-xs opacity-70 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={profileEmail}
                    className="w-full glass-input px-4 py-2.5 text-xs opacity-70 cursor-not-allowed"
                  />
                </div>
              </div>
            </GlassCard>

            <GlassCard glowColor="blue">
              <h2 className="text-sm font-bold text-white mb-1 flex items-center space-x-2">
                <Key className="h-4 w-4 text-blue-400" />
                <span>AI Agent LLM Provider Keys</span>
              </h2>
              <p className="text-xs text-zinc-400 mb-6">Configure custom OpenAI or Gemini keys to override system defaults.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">OpenAI API Key (GPT-4o / GPT-4o-mini)</label>
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full glass-input px-4 py-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Google Gemini API Key (Gemini 1.5 Pro)</label>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full glass-input px-4 py-2.5 text-xs"
                  />
                </div>
              </div>
            </GlassCard>

            <div className="flex items-center space-x-4">
              <button
                type="submit"
                className="flex items-center space-x-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-purple-500/25 hover:scale-105 transition-all"
              >
                <Save className="h-4 w-4" />
                <span>Save Settings</span>
              </button>

              {saved && (
                <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Saved!</span>
                </span>
              )}
            </div>

          </form>

        </main>
      </div>
    </div>
  )
}
