import { useEffect, useRef, useState } from 'react'
import { useTestStore, computeScores } from '../store/useTestStore'
import { ArrowRight, RotateCcw } from 'lucide-react'
import tests from '../data'

const SECTION_LABELS = { english: 'English', math: 'Math', reading: 'Reading' }

export default function Results() {
  const { activeTestId, answers, testResults, saveResults, goToReview, resetToHome } = useTestStore()
  const [saved, setSaved] = useState(false)
  const resultRef = useRef(null)
  const test = tests.find(t => t.id === activeTestId)
  const scores = test ? computeScores(test, answers) : null
  const prev = [...testResults].reverse().find(r => r.testId === activeTestId)
  const improvement = scores && prev?.scores?.composite != null ? scores.composite - prev.scores.composite : null

  useEffect(() => {
    if (!saved && test) {
      saveResults(test)
      setSaved(true)
    }
  }, [test, saved, saveResults])

  if (!test || !scores) return null

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <span className="font-semibold text-gray-900">{test.name}</span>
        <span className="text-sm text-gray-400">Complete</span>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-10">
        <div className="flex items-end gap-5 mb-8">
          <div className="text-6xl font-black text-gray-900">{scores.composite}</div>
          <div className="pb-2">
            <div className="text-sm text-gray-400">Composite / 36</div>
            <div className="text-sm text-gray-500">
              {scores.totalCorrect}/{scores.totalQuestions} correct
              {improvement != null && ` · ${improvement > 0 ? '+' : ''}${improvement} vs last ${test.name}`}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {Object.entries(scores.sections).map(([id, section]) => (
            <div key={id} className="rounded-2xl bg-gray-50 p-5">
              <div className="text-sm text-gray-500 mb-1">{SECTION_LABELS[id]}</div>
              <div className="text-2xl font-bold text-gray-900">{section.correct}/{section.total}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={goToReview} className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-4 rounded-2xl font-semibold hover:bg-gray-800">
            Start Review <ArrowRight size={18} />
          </button>
          <button onClick={resetToHome} className="flex items-center justify-center gap-2 border border-gray-200 text-gray-600 px-6 py-4 rounded-2xl font-semibold hover:bg-gray-50">
            <RotateCcw size={16} /> Home
          </button>
        </div>
      </main>
    </div>
  )
}
