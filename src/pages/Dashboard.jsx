import { useTestStore } from '../store/useTestStore'
import { BookOpen, Clock, TrendingUp, Award, ChevronRight, Calendar, Target } from 'lucide-react'
import tests from '../data'

const SECTION_LABELS = { english: 'English', math: 'Math', reading: 'Reading', science: 'Science' }
const SECTION_COLORS = {
  english: 'bg-blue-50 text-blue-700',
  math: 'bg-purple-50 text-purple-700',
  reading: 'bg-green-50 text-green-700',
  science: 'bg-orange-50 text-orange-700',
}

export default function Dashboard() {
  const { startTest, testResults } = useTestStore()

  const latest = testResults[testResults.length - 1]
  const prev = testResults[testResults.length - 2]
  const bestComposite = testResults.length > 0
    ? Math.max(...testResults.map(r => r.scores.composite))
    : null

  const improvement = latest && prev
    ? latest.scores.composite - prev.scores.composite
    : null

  return (
    <div className="min-h-screen bg-white">
      {/* Top nav */}
      <header className="border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">A</span>
          </div>
          <span className="font-semibold text-gray-900 text-lg">ACT Prep</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{testResults.length} tests completed</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-12">
        {/* Hero */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Practice Tests</h1>
          <p className="text-gray-500 text-lg">
            {testResults.length === 0
              ? 'Start your first test to begin tracking progress.'
              : `You've completed ${testResults.length} test${testResults.length > 1 ? 's' : ''}. Keep going.`}
          </p>
        </div>

        {/* Stats row */}
        {testResults.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-12">
            <StatCard
              icon={<Award size={20} />}
              label="Best Score"
              value={bestComposite}
              sub="composite"
            />
            <StatCard
              icon={<Target size={20} />}
              label="Latest Score"
              value={latest?.scores.composite}
              sub={latest ? new Date(latest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
            />
            <StatCard
              icon={<TrendingUp size={20} />}
              label="Improvement"
              value={improvement !== null ? (improvement >= 0 ? `+${improvement}` : improvement) : '—'}
              sub="from last test"
              positive={improvement > 0}
              negative={improvement < 0}
            />
            <StatCard
              icon={<Calendar size={20} />}
              label="Tests Taken"
              value={testResults.length}
              sub={`of ${tests.length} available`}
            />
          </div>
        )}

        {/* Section breakdown (latest test) */}
        {latest && (
          <div className="mb-12 bg-gray-50 rounded-2xl p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Latest Test Breakdown</h2>
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(latest.scores.scaled).map(([sec, score]) => (
                <div key={sec} className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">{score}</div>
                  <div className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full inline-block ${SECTION_COLORS[sec]}`}>
                    {SECTION_LABELS[sec]}
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    {latest.scores.sections[sec].correct}/{latest.scores.sections[sec].total} correct
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test list */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-4">Available Tests</h2>
          <div className="space-y-3">
            {tests.map((test) => {
              const result = testResults.filter(r => r.testId === test.id).pop()
              return (
                <TestCard
                  key={test.id}
                  test={test}
                  result={result}
                  onStart={() => startTest(test.id)}
                />
              )
            })}
          </div>
        </div>

        {/* Error analysis */}
        {testResults.length > 0 && <ErrorAnalysis results={testResults} />}
      </main>
    </div>
  )
}

function StatCard({ icon, label, value, sub, positive, negative }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-5">
      <div className="flex items-center gap-2 text-gray-400 mb-3">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-3xl font-bold ${positive ? 'text-green-600' : negative ? 'text-red-500' : 'text-gray-900'}`}>
        {value ?? '—'}
      </div>
      <div className="text-xs text-gray-400 mt-1">{sub}</div>
    </div>
  )
}

function TestCard({ test, result, onStart }) {
  const totalQ = test.sections.reduce((sum, s) => {
    const pQ = (s.passages || []).reduce((a, p) => a + p.questions.length, 0)
    const dQ = (s.questions || []).length
    return sum + pQ + dQ
  }, 0)

  return (
    <div className="border border-gray-200 rounded-2xl p-5 flex items-center justify-between hover:border-gray-300 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
          <BookOpen size={20} className="text-white" />
        </div>
        <div>
          <div className="font-semibold text-gray-900">{test.name}</div>
          <div className="text-sm text-gray-400 flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1"><Clock size={13} /> 2h 55min</span>
            <span>{totalQ} questions</span>
            <span>4 sections</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {result ? (
          <div className="text-right mr-2">
            <div className="text-2xl font-bold text-gray-900">{result.scores.composite}</div>
            <div className="text-xs text-gray-400">composite</div>
          </div>
        ) : null}
        <button
          onClick={onStart}
          className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
        >
          {result ? 'Retake' : 'Start'}
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

function ErrorAnalysis({ results }) {
  const allTags = results.flatMap(r => Object.values(r.errorTags || {})).filter(Boolean)
  if (allTags.length === 0) return null

  const counts = allTags.reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc }, {})
  const total = allTags.length

  return (
    <div className="mt-12 bg-gray-50 rounded-2xl p-6">
      <h2 className="font-semibold text-gray-900 mb-4">Error Breakdown</h2>
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: 'conceptual', label: 'Conceptual', color: 'bg-blue-100 text-blue-700' },
          { key: 'silly', label: 'Silly Mistakes', color: 'bg-yellow-100 text-yellow-700' },
          { key: 'strategy', label: 'Strategy', color: 'bg-purple-100 text-purple-700' },
        ].map(({ key, label, color }) => (
          <div key={key} className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{counts[key] || 0}</div>
            <div className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full inline-block ${color}`}>{label}</div>
            <div className="text-xs text-gray-400 mt-2">
              {total > 0 ? Math.round((counts[key] || 0) / total * 100) : 0}% of errors
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
