import { useEffect, useRef, useState } from 'react'
import { useTestStore, computeScores } from '../store/useTestStore'
import { TrendingUp, TrendingDown, Minus, ArrowRight, RotateCcw } from 'lucide-react'
import tests from '../data'

const SECTION_LABELS = { english: 'English', math: 'Math', reading: 'Reading', science: 'Science' }
const SECTION_COLORS = {
  english: { ring: '#3b82f6', bg: 'bg-blue-50', text: 'text-blue-700' },
  math: { ring: '#8b5cf6', bg: 'bg-purple-50', text: 'text-purple-700' },
  reading: { ring: '#10b981', bg: 'bg-green-50', text: 'text-green-700' },
  science: { ring: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700' },
}

export default function Results() {
  const { activeTestId, answers, testResults, saveResults, goToReview, resetToHome } = useTestStore()
  const [saved, setSaved] = useState(false)
  const [animScore, setAnimScore] = useState(0)
  const resultRef = useRef(null)

  const test = tests.find(t => t.id === activeTestId)
  const scores = test ? computeScores(test, answers) : null
  const prev = testResults.length > 0 ? testResults[testResults.length - 1] : null
  const prevComposite = prev?.scores?.composite
  const improvement = scores && prevComposite ? scores.composite - prevComposite : null


  useEffect(() => {
    if (!saved && test) {
      if (test) saveResults(test)
      setSaved(true)
    }
  }, [test, saved])

  // Animate composite score
  useEffect(() => {
    if (!scores) return
    const target = scores.composite
    let current = 0
    const step = Math.ceil(target / 40)
    const id = setInterval(() => {
      current = Math.min(current + step, target)
      setAnimScore(current)
      if (current >= target) clearInterval(id)
    }, 40)
    return () => clearInterval(id)
  }, [scores?.composite])

  if (!test || !scores) return null

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">A</span>
          </div>
          <span className="font-semibold text-gray-900">{test.name}</span>
        </div>
        <span className="text-sm text-gray-400">Test Complete</span>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-12">
        {/* Hero score */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full text-sm font-medium mb-6">
            Test Complete
          </div>

          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="text-8xl font-black text-gray-900">{animScore}</div>
            <div className="text-left">
              <div className="text-gray-400 text-sm font-medium">Composite</div>
              <div className="text-gray-300 text-4xl font-light">/ 36</div>
              {improvement !== null && (
                <div className={`flex items-center gap-1 text-sm font-semibold mt-2 ${
                  improvement > 0 ? 'text-green-600' : improvement < 0 ? 'text-red-500' : 'text-gray-400'
                }`}>
                  {improvement > 0 ? <TrendingUp size={16} /> : improvement < 0 ? <TrendingDown size={16} /> : <Minus size={16} />}
                  {improvement > 0 ? `+${improvement}` : improvement} from last test
                </div>
              )}
            </div>
          </div>

          <p className="text-gray-400">
            {scores.totalCorrect} of {scores.totalQuestions} questions correct
            {' '}({Math.round(scores.totalCorrect / scores.totalQuestions * 100)}%)
          </p>
        </div>

        {/* Section scores */}
        <div className="grid grid-cols-4 gap-4 mb-12">
          {Object.entries(scores.scaled).map(([sec, score]) => {
            const s = scores.sections[sec]
            const c = SECTION_COLORS[sec]
            const pct = s.total > 0 ? s.correct / s.total : 0
            const circumference = 2 * Math.PI * 40
            const offset = circumference * (1 - pct)

            return (
              <div key={sec} className="bg-gray-50 rounded-2xl p-6 flex flex-col items-center">
                {/* Ring */}
                <div className="relative w-24 h-24 mb-4">
                  <svg className="w-24 h-24" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="40" fill="none"
                      stroke={c.ring} strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                      className="score-ring"
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black text-gray-900">{score}</span>
                  </div>
                </div>
                <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
                  {SECTION_LABELS[sec]}
                </div>
                <div className="text-xs text-gray-400 mt-2">{s.correct}/{s.total}</div>
              </div>
            )
          })}
        </div>

        {/* Motivational message */}
        <div className="bg-gray-50 rounded-2xl p-8 text-center mb-8">
          <div className="text-2xl mb-2">
            {scores.composite >= 30 ? '🔥' : scores.composite >= 25 ? '💪' : scores.composite >= 20 ? '📈' : '🎯'}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {scores.composite >= 30 ? 'Elite performance.' :
             scores.composite >= 25 ? 'Strong work. Keep pushing.' :
             scores.composite >= 20 ? 'Solid foundation. Room to grow.' :
             'Every test is progress. Review your mistakes.'}
          </h2>
          <p className="text-gray-500 text-sm">
            Review each question to understand your errors and build better habits.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={goToReview}
            className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-4 rounded-2xl font-semibold hover:bg-gray-800 transition-colors"
          >
            Review Questions
            <ArrowRight size={18} />
          </button>
          <button
            onClick={resetToHome}
            className="flex items-center justify-center gap-2 border border-gray-200 text-gray-600 px-6 py-4 rounded-2xl font-semibold hover:bg-gray-50 transition-colors"
          >
            <RotateCcw size={16} />
            Home
          </button>
        </div>
      </main>
    </div>
  )
}
