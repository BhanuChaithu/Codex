import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  Terminal, Mail, Lock, User as UserIcon, ArrowRight, Eye, EyeOff, 
  Sparkles, CheckCircle2
} from 'lucide-react'
import MouseGlow from '../components/MouseGlow'

import { API_BASE_URL } from '../config/api'

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await axios.post(`${API_BASE_URL}/api/v1/auth/register`, {
        full_name: fullName,
        email,
        password
      })

      const loginRes = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
        email,
        password
      })

      localStorage.setItem('token', loginRes.data.access_token)
      localStorage.setItem('user_id', loginRes.data.user_id)
      localStorage.setItem('user_email', loginRes.data.email)
      localStorage.setItem('full_name', loginRes.data.full_name)

      toast.success('Account created successfully! Welcome to Codex Detective.')
      navigate('/dashboard')
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Registration failed.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-white flex relative overflow-hidden bg-grid-pattern">
      <MouseGlow />

      <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-purple-950/60 via-blue-950/40 to-zinc-950 p-12 flex-col justify-between border-r border-white/10 overflow-hidden">
        <div className="pointer-events-none absolute top-10 left-10 w-96 h-96 bg-blue-600/20 rounded-full blur-[140px]" />
        
        <div className="flex items-center space-x-3 relative z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 p-0.5 shadow-lg shadow-purple-500/25">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-zinc-950">
              <Terminal className="h-5 w-5 text-blue-400" />
            </div>
          </div>
          <span className="font-extrabold text-lg text-white">CODEX DETECTIVE</span>
        </div>

        <div className="relative z-10 space-y-6">
          <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300 border border-purple-500/20 inline-flex items-center space-x-1.5">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>START YOUR FREE TRIAL</span>
          </span>
          <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
            Deploy AI Engineering <br />
            <span className="text-gradient-purple">Agents in Seconds</span>
          </h2>
          <div className="space-y-3 text-xs text-zinc-300">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Full GitHub repository clone & upload support</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Instant pytest test suite generation</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Executive security report PDF export</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-zinc-500">
          Join thousands of professional developers today.
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md space-y-6"
        >
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Create Account</h1>
            <p className="text-xs text-zinc-400">Get started with autonomous AI software reviews</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full glass-input pl-10 pr-4 py-2.5 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full glass-input pl-10 pr-4 py-2.5 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full glass-input pl-10 pr-10 py-2.5 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3 text-xs font-bold text-white shadow-lg shadow-purple-500/25 hover:scale-[1.01] transition-all disabled:opacity-50"
            >
              {loading ? <span>Creating Account...</span> : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-zinc-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-purple-400 hover:underline">
              Sign In
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
