export function SkeletonCard() {
  return (
    <div className="glass-card p-6 border border-white/10 rounded-2xl animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 bg-white/10 rounded-md animate-shimmer" />
        <div className="h-8 w-8 bg-white/10 rounded-full animate-shimmer" />
      </div>
      <div className="h-8 w-36 bg-white/10 rounded-lg animate-shimmer" />
      <div className="h-3 w-48 bg-white/5 rounded-md animate-shimmer" />
    </div>
  )
}

export function SkeletonTableRow() {
  return (
    <div className="flex items-center space-x-4 p-4 glass-card border border-white/5 rounded-xl animate-pulse">
      <div className="h-10 w-10 bg-white/10 rounded-lg animate-shimmer" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/3 bg-white/10 rounded animate-shimmer" />
        <div className="h-3 w-1/2 bg-white/5 rounded animate-shimmer" />
      </div>
      <div className="h-6 w-20 bg-white/10 rounded-full animate-shimmer" />
    </div>
  )
}
