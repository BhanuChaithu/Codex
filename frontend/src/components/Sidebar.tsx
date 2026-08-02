import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, FolderGit2, AlertTriangle, ShieldCheck, 
  FileText, Settings, ChevronLeft, ChevronRight, Zap
} from 'lucide-react'

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects & Repos', path: '/dashboard?tab=projects', icon: FolderGit2 },
    { name: 'Issues & Bugs', path: '/dashboard?tab=issues', icon: AlertTriangle },
    { name: 'Security Audits', path: '/dashboard?tab=security', icon: ShieldCheck },
    { name: 'Performance AI', path: '/dashboard?tab=performance', icon: Zap },
    { name: 'Reports & Logs', path: '/dashboard?tab=reports', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ]

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="sticky top-16 h-[calc(100vh-4rem)] flex-shrink-0 glass-panel border-r border-white/10 flex flex-col justify-between p-3 z-30 hidden md:flex"
    >
      <div className="space-y-6">
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Engineering Workspace
            </p>
          )}
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || (item.path.startsWith('/dashboard') && location.pathname === '/dashboard')

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`relative flex items-center space-x-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all group ${
                  isActive 
                    ? 'text-white bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-purple-500/30' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeSidePill"
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-to-b from-blue-400 to-purple-500 shadow-[0_0_10px_rgba(139,92,246,0.8)]"
                  />
                )}
                <Icon className={`h-4 w-4 flex-shrink-0 transition-colors ${isActive ? 'text-purple-400' : 'text-zinc-400 group-hover:text-zinc-200'}`} />
                {!collapsed && (
                  <span className="truncate">{item.name}</span>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="pt-4 border-t border-white/10 space-y-3">
        {!collapsed && (
          <div className="rounded-xl glass-card p-3 border border-purple-500/20 bg-purple-500/5">
            <div className="flex items-center space-x-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-semibold text-purple-300">Multi-Agent Engine</span>
            </div>
            <p className="mt-1 text-[10px] text-zinc-400 leading-relaxed">
              7 Autonomous AI Agents active & watching for vulnerabilities.
            </p>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center space-x-2 rounded-xl border border-white/10 bg-white/5 py-2 text-xs text-zinc-400 hover:border-white/20 hover:text-white transition-all"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span>Collapse Sidebar</span>}
        </button>
      </div>
    </motion.aside>
  )
}
