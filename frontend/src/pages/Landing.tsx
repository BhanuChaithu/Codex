import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Terminal, Shield, Cpu, Code2, Sparkles, ArrowRight, 
  CheckCircle2, Play, FileText, Bug, 
  Layers, ChevronRight
} from 'lucide-react'
import GlassCard from '../components/GlassCard'
import MouseGlow from '../components/MouseGlow'
import GithubIcon from '../components/GithubIcon'

export default function Landing() {
  const [activeTab, setActiveTab] = useState<'bug' | 'fix'>('fix')

  const features = [
    {
      icon: Bug,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      title: 'Autonomous Bug Hunter',
      desc: 'Scans syntax trees, runtime boundaries, and concurrency locks to identify subtle edge-case logic failures before deployment.'
    },
    {
      icon: Cpu,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
      title: '1-Click AI Auto Fix',
      desc: 'Generates non-destructive unified Git diff patches and automatically applies code modifications directly to source workspace files.'
    },
    {
      icon: Shield,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      title: 'OWASP Security Scan',
      desc: 'Audits secrets leakage, SQL injections, XSS vulnerabilities, and JWT auth risks with automated NIST score grading.'
    },
    {
      icon: Code2,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
      title: 'Unit Test Generator',
      desc: 'Synthesizes complete pytest and Jest suites with 100% assertion coverage for edge cases, exceptions, and boundary inputs.'
    },
    {
      icon: Layers,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
      title: 'Architecture Review',
      desc: 'Evaluates SOLID principles, cognitive complexity metrics, dependency graphs, and module decoupling guidelines.'
    },
    {
      icon: FileText,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10 border-pink-500/20',
      title: 'Auto Documentation',
      desc: 'Compiles production-ready executive PDF audits, REST API specifications, and updated repository README guides.'
    }
  ]

  const stats = [
    { label: 'Security Audits Executed', value: '10,000+' },
    { label: 'Automated Bugs Resolved', value: '45,800+' },
    { label: 'Lines of Code Analyzed', value: '2.5M+' },
    { label: 'Developer Hours Saved', value: '120,000 hrs' }
  ]

  return (
    <div className="min-h-screen bg-[#09090B] text-white relative overflow-hidden bg-grid-pattern selection:bg-purple-500 selection:text-white">
      <MouseGlow />

      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-r from-blue-600/20 via-purple-600/25 to-pink-600/15 rounded-full blur-[140px] animate-pulse-glow" />
      <div className="pointer-events-none absolute top-[40%] -left-40 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[160px]" />
      <div className="pointer-events-none absolute bottom-10 -right-40 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[160px]" />

      <nav className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-purple-500/25">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-zinc-950">
                <Terminal className="h-6 w-6 text-blue-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                CODEX <span className="text-gradient-purple">DETECTIVE</span>
              </span>
              <span className="ml-2 rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-400 border border-purple-500/20">
                AI SaaS
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-xs font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#demo" className="hover:text-white transition-colors">Live Preview</a>
            <a href="#stats" className="hover:text-white transition-colors">Metrics</a>
          </div>

          <div className="flex items-center space-x-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center space-x-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:border-white/20 hover:text-white transition-all"
            >
              <GithubIcon className="h-4 w-4" />
              <span>GitHub</span>
            </a>
            <Link
              to="/login"
              className="text-xs font-semibold text-zinc-300 hover:text-white px-3 py-2 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-500/25 hover:scale-[1.03] transition-all"
            >
              <span>Start Free</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

        </div>
      </nav>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-24 text-center lg:pt-28">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center space-x-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-semibold text-purple-300 shadow-[0_0_20px_rgba(139,92,246,0.2)]"
        >
          <Sparkles className="h-4 w-4 text-purple-400" />
          <span>AUTONOMOUS AI MULTI-AGENT ENGINEERING PLATFORM</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-8 text-5xl font-black tracking-tight text-white sm:text-7xl lg:text-8xl leading-[1.08]"
        >
          Meet Your <br />
          <span className="text-gradient-purple">AI Software Engineer</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-8 max-w-3xl text-base sm:text-xl text-zinc-400 font-normal leading-relaxed"
        >
          Codex Detective deploys an autonomous squad of AI specialized agents into your codebase. Detect bugs, patch security vulnerabilities, generate test suites, and audit software architecture automatically.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            to="/register"
            className="flex items-center space-x-2 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-purple-500/30 hover:scale-105 transition-all"
          >
            <span>Deploy AI Detective Squad</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#demo"
            className="flex items-center space-x-2 rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-sm font-semibold text-white hover:border-white/30 hover:bg-white/10 transition-all backdrop-blur-lg"
          >
            <Play className="h-4 w-4 fill-white text-white" />
            <span>Watch Interactive Demo</span>
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          id="demo"
          className="mt-16 mx-auto max-w-5xl text-left"
        >
          <GlassCard glowColor="purple" className="p-0 overflow-hidden border-white/15 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 bg-zinc-950/80 px-4 py-3">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-xs text-zinc-400">auth_controller.py — AI Auto-Fix Diff</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('bug')}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                    activeTab === 'bug' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Bug Detected
                </button>
                <button
                  onClick={() => setActiveTab('fix')}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                    activeTab === 'fix' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  AI Patch Applied
                </button>
              </div>
            </div>

            <div className="bg-zinc-950 p-6 font-mono text-xs leading-relaxed overflow-x-auto">
              <AnimatePresence mode="wait">
                {activeTab === 'bug' ? (
                  <motion.div
                    key="bug"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-1 text-rose-300"
                  >
                    <p className="text-zinc-500"># CRITICAL BUG: Direct SQL Injection Vulnerability</p>
                    <p className="text-rose-400 bg-rose-950/40 p-2 rounded border-l-2 border-rose-500">
                      - query = f"SELECT * FROM users WHERE email = '{'{user_input}'}'" # VULNERABLE
                    </p>
                    <p className="text-zinc-400">  result = await db.execute(query)</p>
                    <p className="text-amber-400 mt-3 text-[11px] font-sans flex items-center space-x-1.5">
                      <Bug className="h-3.5 w-3.5" />
                      <span>BugHunter Agent: High severity SQL injection risk detected at line 42.</span>
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="fix"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-1 text-emerald-300"
                  >
                    <p className="text-zinc-500"># REFACTORED BY AUTO-FIX AGENT (100% Safe Parameterized Query)</p>
                    <p className="text-emerald-400 bg-emerald-950/40 p-2 rounded border-l-2 border-emerald-500">
                      + stmt = select(User).where(User.email == user_input) # Parameterized prepared query
                    </p>
                    <p className="text-emerald-300">  result = await db.execute(stmt)</p>
                    <p className="text-emerald-400 mt-3 text-[11px] font-sans flex items-center space-x-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>AutoFix Agent: Code patch verified against OWASP SQLi ruleset & applied.</span>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </GlassCard>
        </motion.div>

      </section>

      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-purple-400">
            ENGINEERING CAPABILITIES
          </h2>
          <p className="mt-3 text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Autonomous Multi-Agent Intelligence
          </p>
          <p className="mt-4 text-zinc-400 text-sm sm:text-base font-normal">
            Seven specialized AI agents work synchronously in background tasks to keep your software resilient, secure, and performant.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon
            return (
              <GlassCard key={idx} glowColor="purple" className="flex flex-col justify-between">
                <div>
                  <div className={`h-12 w-12 rounded-2xl ${feat.bg} flex items-center justify-center border mb-6 shadow-inner`}>
                    <Icon className={`h-6 w-6 ${feat.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-xs text-zinc-400 font-normal leading-relaxed">{feat.desc}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-purple-300 font-medium">
                  <span>Explore Workflow</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </GlassCard>
            )
          })}
        </div>
      </section>

      <section id="stats" className="relative z-10 border-y border-white/10 bg-white/[0.02] py-16">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {stats.map((stat, idx) => (
            <div key={idx} className="space-y-2">
              <p className="text-3xl sm:text-5xl font-black text-gradient-purple">{stat.value}</p>
              <p className="text-xs text-zinc-400 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-28 text-center">
        <GlassCard glowColor="purple" className="p-12 sm:p-16 border-purple-500/30 bg-gradient-to-br from-blue-950/40 via-purple-950/40 to-zinc-950">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Ready to Supercharge Your Code Reviews?
          </h2>
          <p className="mt-4 text-zinc-300 text-sm sm:text-base max-w-xl mx-auto font-normal">
            Join thousands of developers using autonomous AI multi-agent software engineering to ship cleaner code faster.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              to="/register"
              className="flex items-center space-x-2 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-purple-500/30 hover:scale-105 transition-all"
            >
              <span>Get Started Now</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </GlassCard>
      </section>

      <footer className="border-t border-white/10 py-10 text-center text-xs text-zinc-500">
        <p>&copy; {new Date().getFullYear()} Codex Detective. All rights reserved.</p>
      </footer>
    </div>
  )
}
