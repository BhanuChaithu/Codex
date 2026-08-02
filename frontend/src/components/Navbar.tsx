import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Bell, Sparkles, LogOut, Settings, 
  Terminal, ShieldCheck, Check, ChevronDown
} from 'lucide-react'

interface NavbarProps {
  onOpenAIChat?: () => void
}

export default function Navbar({ onOpenAIChat }: NavbarProps) {
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const email = localStorage.getItem('user_email') || 'engineer@codex.ai'
    const name = localStorage.getItem('full_name') || 'Lead Engineer'
    setUserEmail(email)
    setUserName(name)
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center space-x-4">
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 p-0.5 shadow-lg shadow-purple-500/20 transition-transform group-hover:scale-105">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-zinc-950">
                <Terminal className="h-5 w-5 text-blue-400 group-hover:text-purple-400 transition-colors" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 transition-all">
                  CODEX
                </span>
                <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-400 border border-purple-500/20">
                  DETECTIVE v1.0
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium -mt-1 hidden sm:block">AI Multi-Agent Engineering Platform</p>
            </div>
          </Link>
        </div>

        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects, audits, bugs (Press ⌘K)..."
              className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-12 py-2 text-xs text-white placeholder-zinc-500 focus:border-purple-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-zinc-400 font-mono">
              <span>⌘K</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenAIChat}
            className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-purple-500/30 px-3 py-1.5 text-xs font-medium text-purple-300 hover:border-purple-500/60 hover:from-blue-600/30 hover:to-purple-600/30 transition-all shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
            <span className="hidden sm:inline">Ask AI Assistant</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-400 hover:border-white/20 hover:text-white transition-colors"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-purple-500 ring-2 ring-zinc-950 animate-ping" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-purple-500 ring-2 ring-zinc-950" />
            </button>

            <AnimatePresence>
              {notificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 rounded-2xl glass-panel border border-white/15 p-4 shadow-2xl z-50"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h4 className="text-xs font-semibold text-white">AI Agent Notifications</h4>
                    <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-300 font-medium">3 New</span>
                  </div>
                  <div className="mt-3 space-y-3">
                    <div className="flex items-start space-x-3 text-xs">
                      <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-200">Security Scan Complete</p>
                        <p className="text-[11px] text-zinc-400">0 critical vulnerabilities found in Main Repository.</p>
                        <span className="text-[10px] text-zinc-500">2 mins ago</span>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 text-xs border-t border-white/5 pt-2">
                      <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-200">Auto-Fix Patch Applied</p>
                        <p className="text-[11px] text-zinc-400">Refactored SQL injection risk in auth controller.</p>
                        <span className="text-[10px] text-zinc-500">12 mins ago</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center space-x-2 rounded-xl border border-white/10 bg-white/5 p-1.5 hover:border-white/20 transition-all"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white shadow-inner">
                {userName.charAt(0).toUpperCase()}
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400 hidden sm:block" />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel border border-white/15 p-2 shadow-2xl z-50"
                >
                  <div className="px-3 py-2 border-b border-white/10">
                    <p className="text-xs font-semibold text-white">{userName}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{userEmail}</p>
                  </div>
                  <div className="mt-1 space-y-1">
                    <Link
                      to="/settings"
                      className="flex items-center space-x-2.5 rounded-lg px-3 py-2 text-xs text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <Settings className="h-3.5 w-3.5 text-zinc-400" />
                      <span>Account Settings</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2.5 rounded-lg px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5 text-rose-400" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </header>
  )
}
