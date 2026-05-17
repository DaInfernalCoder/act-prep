import { useMemo } from 'react'
import { useTestStore } from '../store/useTestStore'
import { Home } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import tests from '../data'

const SECTION_COLORS = { english: '#6366f1', math: '#f59e0b', reading: '#10b981' }
const TEST_NAME = Object.fromEntries(tests.map(t => [t.id, t.name]))

function fmt(dateStr) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
      <div className="font-bold mb-1">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function TrendsPage() {
  const { testResults, resetToHome } = useTestStore()

  const chronoData = useMemo(() => {
    return [...testResults]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((r, i) => ({
        label: `${TEST_NAME[r.testId] ?? r.testId} (${fmt(r.date)})`,
        attempt: i + 1,
        Composite: r.scores?.composite ?? null,
        English: r.scores?.scaled?.english ?? null,
        Math: r.scores?.scaled?.math ?? null,
        Reading: r.scores?.scaled?.reading ?? null,
      }))
  }, [testResults])

  // Best scores per section
  const bests = useMemo(() => {
    const out = { composite: 0, english: 0, math: 0, reading: 0 }
    for (const r of testResults) {
      if ((r.scores?.composite ?? 0) > out.composite) out.composite = r.scores.composite
      if ((r.scores?.scaled?.english ?? 0) > out.english) out.english = r.scores.scaled.english
      if ((r.scores?.scaled?.math ?? 0) > out.math) out.math = r.scores.scaled.math
      if ((r.scores?.scaled?.reading ?? 0) > out.reading) out.reading = r.scores.scaled.reading
    }
    return out
  }, [testResults])

  const hasData = chronoData.length > 0

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={resetToHome} className="text-gray-400 hover:text-gray-700 transition-colors">
            <Home size={20} />
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Score Trends</h1>
        </div>

        {!hasData && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center text-gray-400">
            Complete a test to see your trends.
          </div>
        )}

        {hasData && (
          <>
            {/* PB cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {[
                { label: 'Best Composite', val: bests.composite, color: 'text-gray-900' },
                { label: 'Best English', val: bests.english, color: 'text-indigo-600' },
                { label: 'Best Math', val: bests.math, color: 'text-amber-500' },
                { label: 'Best Reading', val: bests.reading, color: 'text-emerald-600' },
              ].map(({ label, val, color }) => (
                <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-200 px-5 py-4">
                  <div className="text-xs text-gray-400 mb-1">{label}</div>
                  <div className={`text-3xl font-black ${color}`}>{val || '—'}</div>
                </div>
              ))}
            </div>

            {/* Composite trend */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-5 py-6 mb-6">
              <h2 className="text-sm font-bold text-gray-700 mb-4">Composite Score</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chronoData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis domain={[1, 36]} ticks={[1,6,12,18,24,30,36]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={30} stroke="#d1d5db" strokeDasharray="4 4" label={{ value: '30', position: 'insideRight', fontSize: 10, fill: '#d1d5db' }} />
                  <Line type="monotone" dataKey="Composite" stroke="#111827" strokeWidth={2.5} dot={{ r: 4, fill: '#111827' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Section trends */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-5 py-6">
              <h2 className="text-sm font-bold text-gray-700 mb-4">Section Scores</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chronoData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis domain={[1, 36]} ticks={[1,6,12,18,24,30,36]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="English" stroke={SECTION_COLORS.english} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="Math" stroke={SECTION_COLORS.math} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="Reading" stroke={SECTION_COLORS.reading} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* History table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mt-6 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400">Test</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-400">Date</th>
                    <th className="text-right px-3 py-3 text-xs font-semibold text-indigo-400">ENG</th>
                    <th className="text-right px-3 py-3 text-xs font-semibold text-amber-500">MATH</th>
                    <th className="text-right px-3 py-3 text-xs font-semibold text-emerald-600">READ</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-700">COMP</th>
                  </tr>
                </thead>
                <tbody>
                  {[...testResults].sort((a, b) => new Date(b.date) - new Date(a.date)).map((r, i) => (
                    <tr key={r.localId ?? r.id ?? i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-2.5 font-medium text-gray-800">{TEST_NAME[r.testId] ?? r.testId}</td>
                      <td className="px-3 py-2.5 text-gray-400">{fmt(r.date)}</td>
                      <td className="px-3 py-2.5 text-right text-indigo-600 font-bold">{r.scores?.scaled?.english ?? '—'}</td>
                      <td className="px-3 py-2.5 text-right text-amber-500 font-bold">{r.scores?.scaled?.math ?? '—'}</td>
                      <td className="px-3 py-2.5 text-right text-emerald-600 font-bold">{r.scores?.scaled?.reading ?? '—'}</td>
                      <td className="px-5 py-2.5 text-right font-black text-gray-900">{r.scores?.composite ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
