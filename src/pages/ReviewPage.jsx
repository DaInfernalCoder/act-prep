import { useEffect, useMemo, useState } from 'react'
import { useTestStore } from '../store/useTestStore'
import { Check, ChevronLeft, ChevronRight, Home } from 'lucide-react'
import tests from '../data'

const ACTIVE_SECTIONS = ['english', 'math', 'reading']
const SECTION_LABELS = { english: 'English', math: 'Math', reading: 'Reading' }
const REVIEW_SECONDS = 5 * 60
const ERROR_TAGS = [
  { key: 'conceptual', label: 'Conceptual', detail: "I didn't know the concept." },
  { key: 'silly', label: 'Silly Mistake', detail: 'I knew it and slipped.' },
  { key: 'strategy', label: 'Strategy', detail: 'I used the wrong approach.' },
]

function formatTime(total) {
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

export default function ReviewPage() {
  const { activeTestId, answers, errorTags, mindsetNotes, setErrorTag, setMindsetNote, resetToHome } = useTestStore()
  const [index, setIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  const test = tests.find(t => t.id === activeTestId)

  const wrongQuestions = useMemo(() => {
    if (!test) return []
    const items = []
    for (const section of test.sections.filter(s => ACTIVE_SECTIONS.includes(s.id))) {
      for (const passage of section.passages || []) {
        for (const q of passage.questions) {
          const key = `${section.id}-${q.number - 1}`
          if (answers[key] !== q.correct) items.push({ section, passage, q, key })
        }
      }
      for (const q of section.questions || []) {
        const key = `${section.id}-${q.number - 1}`
        if (answers[key] !== q.correct) items.push({ section, passage: null, q, key })
      }
    }
    return items
  }, [test, answers])

  const current = wrongQuestions[index]
  const taggedCount = wrongQuestions.filter(({ key }) => errorTags[key]).length
  const timeLeft = Math.max(0, REVIEW_SECONDS - elapsed)
  const helpReady = elapsed >= REVIEW_SECONDS

  useEffect(() => {
    setElapsed(0)
  }, [index])

  useEffect(() => {
    if (!current) return
    const id = setInterval(() => setElapsed(v => v + 1), 1000)
    return () => clearInterval(id)
  }, [current?.key])

  if (!test) return null

  if (!current) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-100 px-8 py-4 flex justify-between">
          <span className="font-semibold">Review — {test.name}</span>
          <button onClick={resetToHome} className="text-sm text-gray-500 hover:text-black">Home</button>
        </header>
        <main className="max-w-xl mx-auto px-8 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900">No missed questions.</h1>
        </main>
      </div>
    )
  }

  const { section, passage, q, key } = current
  const userAnswer = answers[key]
  const errorTag = errorTags[key]
  const mindsetNote = mindsetNotes[key] || ''
  const imageSrc = section.id === 'english' ? (q.imageSrc || passage?.imageSrc) : (passage?.imageSrc || q.imageSrc)

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="font-semibold text-gray-900">Review missed questions</div>
          <div className="text-sm text-gray-400">{taggedCount}/{wrongQuestions.length} tagged</div>
        </div>
        <button onClick={resetToHome} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-black">
          <Home size={14} /> Home
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 border-r border-gray-100 overflow-y-auto bg-gray-50 p-4">
          {imageSrc ? <img src={imageSrc} alt="" className="w-full" /> : <div className="text-sm text-gray-400">No page image.</div>}
        </div>

        <div className="w-[500px] flex flex-col overflow-hidden">
          <div className="border-b border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {SECTION_LABELS[section.id]} Q{q.number} · {index + 1}/{wrongQuestions.length}
              </span>
              <div className={`text-2xl font-black ${helpReady ? 'text-amber-600' : 'text-gray-900'}`}>
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {section.id !== 'math' && <p className="text-[15px] leading-relaxed text-gray-800 mb-5">{q.stem}</p>}

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-red-500 mb-1">Your answer</div>
                <div className="text-2xl font-black text-red-700">{userAnswer || 'Blank'}</div>
              </div>
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-green-600 mb-1">Correct answer</div>
                <div className="text-2xl font-black text-green-700">{q.correct}</div>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              {Object.entries(q.choices).map(([letter, text]) => {
                const right = letter === q.correct
                const yours = letter === userAnswer
                return (
                  <div key={letter} className={`answer-choice text-sm ${right ? 'correct' : yours ? 'incorrect' : ''}`}>
                    <span className="font-bold w-5 flex-shrink-0">{letter}.</span>
                    {section.id !== 'math' && <span className="flex-1">{text}</span>}
                    {right && <span className="ml-auto text-xs font-semibold text-green-600">Correct</span>}
                    {yours && !right && <span className="ml-auto text-xs font-semibold text-red-500">Your answer</span>}
                  </div>
                )
              })}
            </div>

            <div className="mb-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Why did you miss it?</div>
              <div className="space-y-2">
                {ERROR_TAGS.map(({ key: tag, label, detail }) => (
                  <button
                    key={tag}
                    onClick={() => setErrorTag(key, tag)}
                    className={`w-full flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all ${
                      errorTag === tag
                        ? 'border-black bg-black text-white shadow-sm'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      errorTag === tag ? 'border-white bg-white text-black' : 'border-gray-300'
                    }`}>
                      {errorTag === tag && <Check size={14} strokeWidth={3} />}
                    </span>
                    <span>
                      <span className="block text-sm font-bold">{label}</span>
                      <span className={`block text-xs mt-0.5 ${errorTag === tag ? 'text-gray-300' : 'text-gray-500'}`}>{detail}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Correction / lesson</div>
              <textarea
                className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-black"
                rows={4}
                placeholder="What should you notice or do next time?"
                value={mindsetNote}
                onChange={e => setMindsetNote(key, e.target.value)}
              />
            </div>
          </div>

          <div className="border-t border-gray-100 p-4 flex items-center justify-between">
            <button disabled={index === 0} onClick={() => setIndex(i => i - 1)} className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-gray-600 disabled:opacity-30">
              <ChevronLeft size={16} /> Prev
            </button>
            <button disabled={index === wrongQuestions.length - 1} onClick={() => setIndex(i => i + 1)} className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-gray-600 disabled:opacity-30">
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
