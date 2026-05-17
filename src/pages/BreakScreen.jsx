import { useEffect } from 'react'
import { useTestStore } from '../store/useTestStore'

export default function BreakScreen() {
  const { breakTimeRemaining, tickBreak, endBreak } = useTestStore()

  useEffect(() => {
    const id = setInterval(tickBreak, 1000)
    return () => clearInterval(id)
  }, [tickBreak])

  const mins = Math.floor(breakTimeRemaining / 60)
  const secs = breakTimeRemaining % 60
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`

  return (
    <div className="break-screen min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center w-80">
        <div className="border border-white/20 rounded-2xl p-10 text-center w-full mb-6">
          <div className="text-sm text-gray-400 mb-3 font-medium">Remaining Break Time</div>
          <div className="text-7xl font-bold text-white tracking-tight">{timeStr}</div>
        </div>
        <button
          onClick={endBreak}
          className="w-full bg-yellow-400 text-black font-bold py-4 rounded-2xl text-base hover:bg-yellow-300 transition-colors"
        >
          Resume Testing
        </button>
      </div>
    </div>
  )
}
