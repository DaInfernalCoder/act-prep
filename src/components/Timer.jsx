import { useEffect } from 'react'
import { useTestStore } from '../store/useTestStore'

export default function Timer({ hidden }) {
  const { timeRemaining, tickTimer } = useTestStore()

  useEffect(() => {
    const id = setInterval(tickTimer, 1000)
    return () => clearInterval(id)
  }, [tickTimer])

  const mins = Math.floor(timeRemaining / 60)
  const secs = timeRemaining % 60
  const isLow = timeRemaining <= 5 * 60
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`

  if (hidden) return <div className="text-sm text-gray-400 font-mono">Hidden</div>

  return (
    <span className={`font-mono text-xl font-bold tracking-tight ${isLow ? 'timer-red' : 'text-gray-900'}`}>
      {timeStr}
    </span>
  )
}
