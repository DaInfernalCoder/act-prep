import { useEffect } from 'react'
import { useTestStore } from '../store/useTestStore'

const BREAK_RULES = [
  'Do not close this app or shut your device.',
  'Do not access phones, smartwatches, or any notes.',
  'Do not eat or drink near your device.',
  'Do not discuss the exam with anyone.',
  'Do not access the internet or any study materials.',
]

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
    <div className="break-screen min-h-screen flex">
      {/* Left: Timer */}
      <div className="w-96 flex flex-col items-center justify-center p-12 border-r border-white/10">
        <div className="text-gray-400 text-sm font-medium uppercase tracking-widest mb-8">
          Break
        </div>

        <div className="border border-white/20 rounded-2xl p-10 text-center w-full mb-8">
          <div className="text-sm text-gray-400 mb-3 font-medium">Remaining Break Time</div>
          <div className="text-6xl font-bold text-white tracking-tight">{timeStr}</div>
        </div>

        <button
          onClick={endBreak}
          className="w-full bg-yellow-400 text-black font-bold py-4 rounded-2xl text-base hover:bg-yellow-300 transition-colors"
        >
          Resume Testing
        </button>

        <p className="text-gray-500 text-xs mt-4 text-center leading-relaxed">
          The next section will auto-start when the timer reaches 0:00
        </p>
      </div>

      {/* Right: Rules */}
      <div className="flex-1 flex items-center justify-center p-16">
        <div className="max-w-lg">
          <h1 className="text-3xl font-bold text-white mb-2">Practice Test Break</h1>
          <p className="text-gray-400 mb-8 leading-relaxed">
            You can resume this practice test as soon as you're ready. On test day, you'll wait until the clock counts down.
          </p>

          <div className="border-t border-white/10 pt-8 mb-8" />

          <h2 className="text-xl font-bold text-white mb-2">
            Take a Break: Do Not Close Your Device
          </h2>
          <p className="text-gray-400 mb-6 text-sm leading-relaxed">
            After the break, a <strong className="text-white">Resume Testing</strong> button will appear and you'll start the next section.
          </p>

          <div className="text-sm font-semibold text-white mb-4">
            Follow these rules during the break:
          </div>

          <ol className="space-y-3">
            {BREAK_RULES.map((rule, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-300 text-sm leading-relaxed">
                <span className="text-gray-500 font-medium flex-shrink-0 w-5">{i + 1}.</span>
                {rule}
              </li>
            ))}
          </ol>

          {/* Bottom name */}
          <div className="mt-16 pt-8 border-t border-white/10">
            <div className="text-gray-500 text-sm">Sumit Datta</div>
          </div>
        </div>
      </div>
    </div>
  )
}
