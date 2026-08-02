import { motion } from 'framer-motion'
import React from 'react'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hoverEffect?: boolean
  onClick?: () => void
  glowColor?: 'blue' | 'purple' | 'green' | 'none'
}

export default function GlassCard({
  children,
  className = '',
  hoverEffect = true,
  onClick,
  glowColor = 'none'
}: GlassCardProps) {
  const glowClasses = {
    blue: 'hover:border-blue-500/40 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]',
    purple: 'hover:border-purple-500/40 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]',
    green: 'hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]',
    none: ''
  }

  return (
    <motion.div
      whileHover={hoverEffect ? { y: -3, scale: 1.005 } : undefined}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onClick={onClick}
      className={`glass-card p-6 border border-white/10 rounded-2xl relative overflow-hidden backdrop-blur-xl ${glowClasses[glowColor]} ${className}`}
    >
      {children}
    </motion.div>
  )
}
