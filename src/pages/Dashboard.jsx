import { useTestStore } from '../store/useTestStore'
import { Check, Trash2 } from 'lucide-react'
import tests from '../data'

export default function Dashboard() {
  const { startTest, testResults } = useTestStore()

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Practice Tests</h1>
        </div>

        <div className="grid grid-cols-4 gap-4">
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
  const { startTest, goToReview, testResults } = useTestStore()
  const composite = result?.scores?.composite

  const handleReview = () => {
    // Set active test context then jump to review
    startTest(test.id)
    // goToReview is called after phase sets — use setTimeout to let state settle
    setTimeout(() => useTestStore.getState().goToReview(), 0)
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-start justify-between border-b border-gray-100">
        <span className="font-bold text-gray-900 text-base leading-tight">{test.name}</span>
        {completed && (
          <button
            onClick={() => {
              if (confirm('Clear results for this test?')) {
                useTestStore.setState(s => ({
                  testResults: s.testResults.filter(r => r.testId !== test.id)
                }))
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
              <div className="text-2xl font-black text-green-600 leading-none">{composite}</div>
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
