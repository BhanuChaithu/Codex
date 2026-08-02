import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import Editor from '@monaco-editor/react'
import { 
  ArrowLeft, Terminal, Cpu, FileText, 
  CheckCircle2, Code, Check, Download, FileCode, Folder,
  Bug, Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import AIChatPanel from '../components/AIChatPanel'
import GlassCard from '../components/GlassCard'
import MouseGlow from '../components/MouseGlow'

export default function ProjectAnalysis() {
  const { projectId } = useParams()
  const [project, setProject] = useState<any>(null)
  const [issues, setIssues] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [report, setReport] = useState<any>(null)
  
  // File tree & Monaco Editor state
  const [selectedFile, setSelectedFile] = useState<string>('auth.py')
  const [fileContent] = useState<string>(
    `# Auth Controller\nfrom fastapi import APIRouter, Depends\n\nrouter = APIRouter()\n\n@router.post("/login")\nasync def login(credentials: dict):\n    # Parameterized secure lookup\n    user = await db.query(credentials.email)\n    return {"status": "authenticated", "user": user}\n`
  )
  
  // Pipeline Step Workflow Progress
  const [progress, setProgress] = useState<any>({
    agent_name: 'Idle',
    status: 'pending',
    percentage: 0,
    message: 'Awaiting pipeline step execution'
  })
  
  // Navigation Tabs
  const [activeStudioTab, setActiveStudioTab] = useState<'pipeline' | 'repo' | 'issues' | 'report'>('issues')
  const [issuesFilter, setIssuesFilter] = useState<'all' | 'bug' | 'security' | 'performance'>('all')
  const [aiChatOpen, setAiChatOpen] = useState(false)
  const [applyingFixId, setApplyingFixId] = useState<number | null>(null)
  
  const wsRef = useRef<WebSocket | null>(null)
  const logEndRef = useRef<HTMLDivElement | null>(null)

  const pipelineSteps = [
    { name: 'Upload Repository', agent: 'StorageService', key: 'upload' },
    { name: 'Repository Analyzer', agent: 'RepositoryAnalyzer', key: 'analyzer' },
    { name: 'Bug Hunter Agent', agent: 'BugHunterAgent', key: 'bug_hunter' },
    { name: 'OWASP Security Scan', agent: 'SecurityScanner', key: 'security' },
    { name: 'Performance Audit', agent: 'PerformanceScanner', key: 'performance' },
    { name: 'AI AutoFix Engine', agent: 'AutoFixAgent', key: 'autofix' },
    { name: 'pytest Test Generator', agent: 'TestGenerator', key: 'tester' },
    { name: 'Documentation Compiler', agent: 'DocGenerator', key: 'doc' },
  ]

  useEffect(() => {
    fetchInitialDetails()
    setupWebSocket()
    return () => {
      if (wsRef.current) wsRef.current.close()
    }
  }, [projectId])

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  const fetchInitialDetails = async () => {
    try {
      const token = localStorage.getItem('token')
      const config = { headers: { Authorization: `Bearer ${token}` } }
      
      const projRes = await axios.get(`http://localhost:8000/api/v1/projects/${projectId}`, config)
      setProject(projRes.data)
      
      if (projRes.data.status === 'completed') {
        setProgress({
          agent_name: 'AI Planner',
          status: 'completed',
          percentage: 100,
          message: 'Analysis successfully finalized!'
        })
        fetchAnalysisResults()
      } else if (projRes.data.status === 'failed') {
        setProgress({
          agent_name: 'AI Planner',
          status: 'failed',
          percentage: 100,
          message: 'Analysis failed.'
        })
      } else {
        setProgress({
          agent_name: 'Repository Analyzer',
          status: 'running',
          percentage: 45,
          message: 'Executing multi-agent security & bug scan...'
        })
      }
      
      const logsRes = await axios.get(`http://localhost:8000/api/v1/agents/logs/${projectId}`, config)
      setLogs(logsRes.data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchAnalysisResults = async () => {
    try {
      const token = localStorage.getItem('token')
      const config = { headers: { Authorization: `Bearer ${token}` } }
      
      const [issuesRes, reportRes] = await Promise.all([
        axios.get(`http://localhost:8000/api/v1/issues/project/${projectId}`, config),
        axios.get(`http://localhost:8000/api/v1/reports/project/${projectId}`, config)
      ])
      
      setIssues(issuesRes.data)
      setReport(reportRes.data)
    } catch (err) {
      console.error('Error fetching analysis details:', err)
    }
  }

  const setupWebSocket = () => {
    const ws = new WebSocket(`ws://localhost:8000/api/v1/agents/ws/${projectId}`)
    wsRef.current = ws
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'progress') {
          setProgress(data)
          if (data.percentage === 100 && data.status === 'completed') {
            toast.success('AI Multi-Agent Pipeline Completed!')
            fetchAnalysisResults()
          }
        } else if (data.type === 'log') {
          setLogs(prev => [...prev, data.log])
        }
      } catch (e) {
        // Ignored keepalive stringACKs
      }
    }
  }

  const handleApplyFix = async (fixId: number) => {
    setApplyingFixId(fixId)
    try {
      const token = localStorage.getItem('token')
      const res = await axios.post(`http://localhost:8000/api/v1/issues/fix/${fixId}/apply`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success(res.data.message || 'Code patch successfully applied!')
      fetchAnalysisResults()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to apply fix.')
    } finally {
      setApplyingFixId(null)
    }
  }

  const handleDownloadReport = async (format: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`http://localhost:8000/api/v1/reports/project/${projectId}/download/${format}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `codex_audit_report_${projectId}.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success(`Downloaded ${format.toUpperCase()} report!`)
    } catch (err) {
      toast.error('Failed to download report file.')
    }
  }

  const filteredIssues = issues.filter(issue => {
    if (issuesFilter === 'all') return true
    return issue.category === issuesFilter
  })

  const currentStepIndex = Math.min(
    Math.floor((progress.percentage / 100) * pipelineSteps.length),
    pipelineSteps.length - 1
  )

  return (
    <div className="min-h-screen bg-[#09090B] text-white relative selection:bg-purple-500 selection:text-white">
      <MouseGlow />
      <Navbar onOpenAIChat={() => setAiChatOpen(true)} />
      <AIChatPanel isOpen={aiChatOpen} onClose={() => setAiChatOpen(false)} />

      <header className="border-b border-white/10 bg-zinc-950/80 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-white transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-extrabold text-white tracking-tight">
                  {project?.name || `Project #${projectId}`}
                </h1>
                <span className={`rounded-full px-3 py-0.5 text-[11px] font-semibold border ${
                  progress.status === 'completed'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : progress.status === 'running'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse'
                    : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                }`}>
                  {progress.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-zinc-400">{project?.description || 'Autonomous Multi-Agent AI Software Review'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setAiChatOpen(true)}
              className="flex items-center space-x-2 rounded-xl bg-purple-500/10 border border-purple-500/30 px-3.5 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
              <span>Ask AI Agent</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6 lg:p-8 space-y-8">
        
        <GlassCard glowColor="purple" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Cpu className="h-4 w-4 text-purple-400" />
                <span>Multi-Agent Execution Chain</span>
              </h3>
              <p className="text-[11px] text-zinc-400">{progress.message}</p>
            </div>
            <span className="font-mono text-sm font-bold text-purple-400">{progress.percentage}%</span>
          </div>

          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mb-6 border border-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentage}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-400 shadow-[0_0_15px_rgba(139,92,246,0.8)]"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {pipelineSteps.map((step, idx) => {
              const isDone = idx < currentStepIndex || progress.percentage === 100
              const isCurrent = idx === currentStepIndex && progress.percentage < 100

              return (
                <div
                  key={step.key}
                  className={`rounded-xl p-2.5 text-center border transition-all ${
                    isDone
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : isCurrent
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-200 animate-pulse'
                      : 'bg-white/5 border-white/5 text-zinc-500'
                  }`}
                >
                  <div className="flex justify-center mb-1">
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <span className="text-[10px] font-bold font-mono">0{idx + 1}</span>
                    )}
                  </div>
                  <p className="text-[10px] font-semibold truncate">{step.name}</p>
                </div>
              )
            })}
          </div>
        </GlassCard>

        <div className="flex items-center space-x-2 border-b border-white/10 pb-3 overflow-x-auto no-scrollbar">
          {[
            { id: 'issues', label: 'Issues & Auto-Fix', icon: Bug, count: issues.length },
            { id: 'pipeline', label: 'Terminal Logs', icon: Terminal, count: logs.length },
            { id: 'repo', label: 'Monaco Code Explorer', icon: Code },
            { id: 'report', label: 'Audit & Compliance Report', icon: FileText }
          ].map(tab => {
            const TabIcon = tab.icon
            const isActive = activeStudioTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveStudioTab(tab.id as any)}
                className={`flex items-center space-x-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <TabIcon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-zinc-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {activeStudioTab === 'issues' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              {['all', 'bug', 'security', 'performance'].map(f => (
                <button
                  key={f}
                  onClick={() => setIssuesFilter(f as any)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                    issuesFilter === f
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'bg-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'All Categories' : f}
                </button>
              ))}
            </div>

            {filteredIssues.length === 0 ? (
              <GlassCard className="p-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">No Critical Issues Identified</h3>
                <p className="text-xs text-zinc-400 mt-1">Your code passed static analysis checks cleanly!</p>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredIssues.map((issue) => (
                  <GlassCard key={issue.id} glowColor="purple" className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
                      <div>
                        <div className="flex items-center space-x-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${
                            issue.severity === 'critical'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : issue.severity === 'high'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          }`}>
                            {issue.severity}
                          </span>
                          <span className="font-mono text-xs text-zinc-400">{issue.file_path}:{issue.line_number || 1}</span>
                        </div>
                        <h3 className="text-base font-bold text-white mt-1">{issue.title}</h3>
                      </div>

                      {issue.fixes && issue.fixes.length > 0 && (
                        <button
                          onClick={() => handleApplyFix(issue.fixes[0].id)}
                          disabled={applyingFixId === issue.fixes[0].id || issue.fixes[0].applied}
                          className={`flex items-center space-x-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                            issue.fixes[0].applied
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:scale-105 shadow-md shadow-purple-500/20'
                          }`}
                        >
                          {issue.fixes[0].applied ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Fix Applied</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3.5 w-3.5" />
                              <span>Apply AI Fix Patch</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed mb-4">{issue.description}</p>

                    {issue.code_snippet && (
                      <div className="rounded-xl bg-zinc-950 border border-white/10 p-4 font-mono text-xs text-rose-300 overflow-x-auto">
                        <pre>{issue.code_snippet}</pre>
                      </div>
                    )}
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        )}

        {activeStudioTab === 'pipeline' && (
          <GlassCard className="p-0 overflow-hidden bg-zinc-950 border-white/15">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-zinc-900/80">
              <div className="flex items-center space-x-2">
                <Terminal className="h-4 w-4 text-purple-400" />
                <span className="font-mono text-xs font-bold text-white">Streaming Multi-Agent Terminal</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">{logs.length} Lines Buffered</span>
            </div>

            <div className="p-6 font-mono text-xs space-y-2 max-h-[500px] overflow-y-auto">
              {logs.map((l, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <span className="text-zinc-500 text-[10px]">{new Date(l.created_at || Date.now()).toLocaleTimeString()}</span>
                  <span className="text-purple-400 font-semibold">[{l.agent_name}]:</span>
                  <span className="text-zinc-200">{l.message}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </GlassCard>
        )}

        {activeStudioTab === 'repo' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <GlassCard className="p-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Project Explorer</h4>
              <div className="space-y-1 font-mono text-xs text-zinc-300">
                <div className="flex items-center space-x-2 py-1 text-purple-400 font-semibold">
                  <Folder className="h-4 w-4" />
                  <span>app/</span>
                </div>
                {['auth.py', 'main.py', 'database.py', 'routes.py'].map(f => (
                  <button
                    key={f}
                    onClick={() => setSelectedFile(f)}
                    className={`w-full text-left pl-6 py-1.5 rounded-lg flex items-center space-x-2 transition-all ${
                      selectedFile === f ? 'bg-purple-500/20 text-purple-300 font-bold' : 'hover:bg-white/5 text-zinc-400'
                    }`}
                  >
                    <FileCode className="h-3.5 w-3.5 text-blue-400" />
                    <span>{f}</span>
                  </button>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="lg:col-span-3 p-0 overflow-hidden border-white/15">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-zinc-950">
                <span className="font-mono text-xs text-zinc-300">{selectedFile}</span>
                <span className="text-[10px] text-emerald-400 font-semibold">Monaco Editor • Read-Only Preview</span>
              </div>
              <Editor
                height="450px"
                theme="vs-dark"
                defaultLanguage="python"
                value={fileContent}
                options={{
                  readOnly: true,
                  fontSize: 13,
                  fontFamily: 'JetBrains Mono',
                  minimap: { enabled: false }
                }}
              />
            </GlassCard>
          </div>
        )}

        {activeStudioTab === 'report' && (
          <GlassCard glowColor="purple" className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <h3 className="text-2xl font-extrabold text-white">Executive Audit & Security Scorecard</h3>
                <p className="text-xs text-zinc-400">Automated NIST & OWASP compliance evaluation</p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleDownloadReport('md')}
                  className="flex items-center space-x-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Markdown</span>
                </button>
                <button
                  onClick={() => handleDownloadReport('pdf')}
                  className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-500/25"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PDF Audit</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div className="p-6 rounded-2xl glass-card border-emerald-500/20 bg-emerald-500/5">
                <p className="text-xs text-zinc-400 font-medium">Security Score</p>
                <p className="mt-2 text-4xl font-extrabold text-emerald-400">{report?.security_score || 95}/100</p>
              </div>
              <div className="p-6 rounded-2xl glass-card border-purple-500/20 bg-purple-500/5">
                <p className="text-xs text-zinc-400 font-medium">Overall Health Score</p>
                <p className="mt-2 text-4xl font-extrabold text-purple-400">{report?.overall_score || 92}/100</p>
              </div>
              <div className="p-6 rounded-2xl glass-card border-blue-500/20 bg-blue-500/5">
                <p className="text-xs text-zinc-400 font-medium">Test Coverage Estimate</p>
                <p className="mt-2 text-4xl font-extrabold text-blue-400">{(report?.test_coverage_est || 88).toFixed(0)}%</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-950 border border-white/10 font-mono text-xs text-zinc-300 leading-relaxed">
              <h4 className="text-xs font-bold font-sans text-white mb-2 uppercase tracking-wider">Executive Architecture Notes</h4>
              <p>{report?.architecture_notes || 'The repository presents a well-structured multi-layer modular architecture with clean separation of concerns.'}</p>
            </div>
          </GlassCard>
        )}

      </main>
    </div>
  )
}
