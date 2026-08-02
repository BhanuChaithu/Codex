import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  FolderPlus, ShieldCheck, AlertTriangle, 
  Terminal, Plus, Trash2, Zap, ExternalLink, Cpu, BarChart3
} from 'lucide-react'
import toast from 'react-hot-toast'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import AIChatPanel from '../components/AIChatPanel'
import GlassCard from '../components/GlassCard'
import MouseGlow from '../components/MouseGlow'
import { SkeletonCard, SkeletonTableRow } from '../components/SkeletonLoader'

export default function Dashboard() {
  const [projects, setProjects] = useState<any[]>([])
  const [stats, setStats] = useState<any>({
    total_projects: 0,
    total_analyses: 0,
    total_issues: 0,
    critical_issues: 0,
    security_score_avg: 100.0,
    total_ai_tokens: 0,
    ai_estimated_cost: 0.0,
    monthly_activity: []
  })
  
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadMode, setUploadMode] = useState<'zip' | 'git'>('zip')
  const [projectName, setProjectName] = useState('')
  const [projectDesc, setProjectDesc] = useState('')
  const [gitUrl, setGitUrl] = useState('')
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [aiChatOpen, setAiChatOpen] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setFetching(true)
      const token = localStorage.getItem('token')
      const config = { headers: { Authorization: `Bearer ${token}` } }
      
      const [projRes, statsRes] = await Promise.all([
        axios.get('http://localhost:8000/api/v1/projects', config),
        axios.get('http://localhost:8000/api/v1/projects/stats', config)
      ])
      
      setProjects(projRes.data)
      setStats(statsRes.data)
    } catch (err) {
      console.error("Error loading dashboard content: ", err)
    } finally {
      setFetching(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const token = localStorage.getItem('token')
    const config = { headers: { Authorization: `Bearer ${token}` } }
    
    try {
      if (uploadMode === 'git') {
        const res = await axios.post('http://localhost:8000/api/v1/projects/import-git', {
          name: projectName,
          description: projectDesc,
          git_url: gitUrl
        }, config)
        toast.success('Git repository imported! Kicking off AI Agent analysis...')
        setUploadOpen(false)
        navigate(`/analysis/${res.data.id}`)
      } else {
        if (!zipFile) {
          toast.error('Please select a project ZIP file to upload.')
          setLoading(false)
          return
        }
        
        const formData = new FormData()
        formData.append('name', projectName)
        if (projectDesc) formData.append('description', projectDesc)
        formData.append('file', zipFile)

        const res = await axios.post('http://localhost:8000/api/v1/projects/upload', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        })

        toast.success('Project archive extracted! Starting multi-agent pipeline...')
        setUploadOpen(false)
        navigate(`/analysis/${res.data.id}`)
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to initialize project.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete project "${name}"?`)) return
    
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`http://localhost:8000/api/v1/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Project workspace removed.')
      fetchDashboardData()
    } catch (err) {
      toast.error('Failed to delete project.')
    }
  }

  const chartData = stats.monthly_activity?.length > 0 ? stats.monthly_activity : [
    { name: 'Jan', analyses: 2, tokens: 1400 },
    { name: 'Feb', analyses: 5, tokens: 3800 },
    { name: 'Mar', analyses: 8, tokens: 9200 },
    { name: 'Apr', analyses: 12, tokens: 14500 }
  ]

  return (
    <div className="min-h-screen bg-[#09090B] text-white relative selection:bg-purple-500 selection:text-white">
      <MouseGlow />
      <Navbar onOpenAIChat={() => setAiChatOpen(true)} />
      <AIChatPanel isOpen={aiChatOpen} onClose={() => setAiChatOpen(false)} />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 min-w-0 p-6 lg:p-10 space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
                <span>Engineering Dashboard</span>
                <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300 border border-purple-500/20">
                  Live Analytics
                </span>
              </h1>
              <p className="mt-1 text-xs text-zinc-400">
                Monitor multi-agent analysis metrics, security audits, and automated fix pipelines.
              </p>
            </div>

            <button
              onClick={() => setUploadOpen(true)}
              className="flex items-center justify-center space-x-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-purple-500/25 hover:scale-105 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Import Project</span>
            </button>
          </div>

          {fetching ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <GlassCard glowColor="purple">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400">Total Projects</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <FolderPlus className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-4 text-3xl font-extrabold text-white">{stats.total_projects}</p>
                <p className="mt-1 text-[11px] text-emerald-400 font-medium flex items-center space-x-1">
                  <span>Active Workspace Repositories</span>
                </p>
              </GlassCard>

              <GlassCard glowColor="blue">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400">Bugs & Issues</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-4 text-3xl font-extrabold text-white">{stats.total_issues}</p>
                <p className="mt-1 text-[11px] text-rose-400 font-medium">
                  {stats.critical_issues} Critical Severity Issues
                </p>
              </GlassCard>

              <GlassCard glowColor="green">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400">Security Score</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-4 text-3xl font-extrabold text-emerald-400">
                  {stats.security_score_avg.toFixed(1)}%
                </p>
                <p className="mt-1 text-[11px] text-zinc-400 font-medium">
                  OWASP Automated Compliance
                </p>
              </GlassCard>

              <GlassCard glowColor="purple">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400">AI Tokens Used</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Zap className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-4 text-3xl font-extrabold text-white">
                  {stats.total_ai_tokens.toLocaleString()}
                </p>
                <p className="mt-1 text-[11px] text-zinc-400 font-medium">
                  Est. Cost: ${stats.ai_estimated_cost.toFixed(4)}
                </p>
              </GlassCard>

            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-purple-400" />
                    <span>Analysis Activity & Token Stream</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">Multi-agent workload performance over time</p>
                </div>
                <span className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-[11px] text-zinc-400 font-mono">
                  Real-time
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorAnalyses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#71717A" fontSize={11} />
                    <YAxis stroke="#71717A" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                    />
                    <Area type="monotone" dataKey="analyses" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorAnalyses)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard glowColor="purple" className="flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 border-b border-white/10 pb-4 mb-4">
                  <div className="h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
                  <h3 className="text-sm font-bold text-white">Active Agent Pipeline</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-zinc-300 font-medium">1. Repository Analyzer</span>
                    <span className="text-emerald-400 font-semibold">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-zinc-300 font-medium">2. Bug Hunter Agent</span>
                    <span className="text-emerald-400 font-semibold">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-zinc-300 font-medium">3. OWASP Security Scanner</span>
                    <span className="text-emerald-400 font-semibold">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-zinc-300 font-medium">4. AutoFix Code Patching</span>
                    <span className="text-emerald-400 font-semibold">Active</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 text-center">
                <button
                  onClick={() => setAiChatOpen(true)}
                  className="w-full flex items-center justify-center space-x-2 rounded-xl bg-purple-500/10 border border-purple-500/30 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition-all"
                >
                  <Cpu className="h-4 w-4" />
                  <span>Open Cursor AI Assistant</span>
                </button>
              </div>
            </GlassCard>
          </div>

          <GlassCard className="p-0 overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Repository Projects</h3>
                <p className="text-xs text-zinc-400">All workspaces uploaded or cloned for AI review</p>
              </div>
              <button
                onClick={() => setUploadOpen(true)}
                className="flex items-center space-x-1.5 rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Project</span>
              </button>
            </div>

            {fetching ? (
              <div className="p-6 space-y-3">
                <SkeletonTableRow /><SkeletonTableRow /><SkeletonTableRow />
              </div>
            ) : projects.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <FolderPlus className="h-12 w-12 text-zinc-600 mx-auto" />
                <p className="text-sm text-zinc-400">No project repositories imported yet.</p>
                <button
                  onClick={() => setUploadOpen(true)}
                  className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-xs font-bold text-white"
                >
                  <span>Import First Project</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-4 sm:px-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-purple-500/20 flex items-center justify-center text-purple-400">
                        <Terminal className="h-5 w-5" />
                      </div>
                      <div>
                        <Link
                          to={`/analysis/${proj.id}`}
                          className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors flex items-center space-x-2"
                        >
                          <span>{proj.name}</span>
                          <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-purple-400" />
                        </Link>
                        <p className="text-xs text-zinc-400">{proj.description || 'No description provided.'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold border ${
                        proj.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : proj.status === 'analyzing' || proj.status === 'cloning'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {proj.status.toUpperCase()}
                      </span>

                      <button
                        onClick={() => handleDeleteProject(proj.id, proj.name)}
                        className="rounded-lg p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

        </main>
      </div>

      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setUploadOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <div className="relative w-full max-w-lg glass-panel border border-white/15 rounded-3xl p-6 shadow-2xl z-10">
            <h2 className="text-xl font-bold text-white mb-1">Import Code Project</h2>
            <p className="text-xs text-zinc-400 mb-6">Choose how you want to load your project into the AI multi-agent workspace.</p>

            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/5 border border-white/10 mb-6">
              <button
                type="button"
                onClick={() => setUploadMode('zip')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  uploadMode === 'zip' ? 'bg-purple-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Upload ZIP Archive
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('git')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  uploadMode === 'git' ? 'bg-purple-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Import Git URL
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Project Name</label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Authentication Microservice"
                  className="w-full glass-input px-4 py-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Description (Optional)</label>
                <input
                  type="text"
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  placeholder="Short summary of codebase scope"
                  className="w-full glass-input px-4 py-2.5 text-xs"
                />
              </div>

              {uploadMode === 'git' ? (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Public Git URL</label>
                  <input
                    type="url"
                    required
                    value={gitUrl}
                    onChange={(e) => setGitUrl(e.target.value)}
                    placeholder="https://github.com/username/repository.git"
                    className="w-full glass-input px-4 py-2.5 text-xs"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Upload .ZIP Archive</label>
                  <input
                    type="file"
                    accept=".zip"
                    required
                    onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                    className="w-full glass-input px-4 py-2 text-xs file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500/30"
                  />
                </div>
              )}

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setUploadOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-500/25 disabled:opacity-50"
                >
                  {loading ? <span>Processing...</span> : <span>Run AI Multi-Agent Review</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
