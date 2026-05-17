import { useState } from 'react'
import { useTestStore } from '../store/useTestStore'
import { Check, Trash2 } from 'lucide-react'
import tests from '../data'

export default function Dashboard() {
  const { startTest, testResults, clearTestResults } = useTestStore()

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Practice Tests</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tests.map((test) => {
            const result = [...testResults].reverse().find(r => r.testId === test.id)
            const completed = !!result
            return (
              <TestCard
                key={test.id}
                test={test}
                result={result}
                completed={completed}
                onStart={() => startTest(test.id)}
                onReview={() => {
                  startTest(test.id)
                  // navigate to review — handled via goToReview after startTest sets activeTestId
                }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

function TestCard({ test, result, completed, onStart }) {
  const { startTest, goToReview, testResults, clearTestResults } = useTestStore()
  const composite = result?.scores?.composite
  const [showBreakdown, setShowBreakdown] = useState(false)

  const handleReview = () => {
    // Set active test context then jump to review
    startTest(test.id)
    // goToReview is called after phase sets — use setTimeout to let state settle
    setTimeout(() => useTestStore.getState().goToReview(), 0)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-start justify-between border-b border-gray-100">
        <span className="font-bold text-gray-900 text-base leading-tight">{test.name}</span>
        {completed && (
          <button
            onClick={() => {
              if (confirm('Clear results for this test?')) {
                clearTestResults(test.id)
              }
            }}
            className="text-gray-300 hover:text-gray-500 transition-colors ml-2 flex-shrink-0"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        {completed ? (
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Check size={15} className="text-gray-500" />
              Completed
            </div>
            {composite != null && (
              <div className="relative">
                <button
                  onClick={() => setShowBreakdown(v => !v)}
                  className="text-2xl font-black text-green-600 leading-none"
                >
                  {composite}
                </button>
                {showBreakdown && (
                  <div className="absolute right-0 bottom-full mb-2 z-10 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between gap-4"><span className="text-gray-400">English</span><span className="font-bold">{result?.scores?.scaled?.english ?? '—'}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-gray-400">Math</span><span className="font-bold">{result?.scores?.scaled?.math ?? '—'}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-gray-400">Reading</span><span className="font-bold">{result?.scores?.scaled?.reading ?? '—'}</span></div>
                    </div>
                    <div className="absolute right-2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-400 mb-4">Not started</div>
        )}

        <div className="flex flex-col gap-2">
          {completed && (
            <button
              onClick={handleReview}
              className="text-sm font-semibold underline underline-offset-2 text-gray-800 text-left"
            >
              View My Responses
            </button>
          )}
          <button
            onClick={onStart}
            className="text-sm font-bold border-2 border-gray-900 rounded-full px-4 py-1.5 hover:bg-gray-900 hover:text-white transition-colors"
          >
            {completed ? 'Retake' : 'Start'}
          </button>
        </div>
      </div>
    </div>
  )
}
