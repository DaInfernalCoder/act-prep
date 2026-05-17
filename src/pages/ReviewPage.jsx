import { useState } from 'react'
import { useTestStore } from '../store/useTestStore'
import { CheckCircle2, XCircle, Minus, ChevronDown, ChevronUp, Home, Filter } from 'lucide-react'
import tests from '../data'

const SECTION_LABELS = { english: 'English', math: 'Math', reading: 'Reading', science: 'Science' }
const ERROR_TAGS = [
  { key: 'conceptual', label: 'Conceptual', desc: 'Didn\'t understand the concept' },
  { key: 'silly', label: 'Silly Mistake', desc: 'Knew it but made an error' },
  { key: 'strategy', label: 'Strategy', desc: 'Wrong approach or method' },
]

export default function ReviewPage() {
  const { activeTestId, answers, errorTags, mindsetNotes, setErrorTag, setMindsetNote, resetToHome } = useTestStore()
  const [filter, setFilter] = useState('all') // all | wrong | flagged | untagged
  const [expandedKey, setExpandedKey] = useState(null)
  const [activeSection, setActiveSection] = useState(null)

  const test = tests.find(t => t.id === activeTestId)
  if (!test) return null

  // Flatten all questions
  const allQuestions = []
  for (const section of test.sections) {
    for (const passage of (section.passages || [])) {
      for (const q of passage.questions) {
        const key = `${section.id}-${q.number - 1}`
        allQuestions.push({ section, passage, q, key })
      }
    }
    for (const q of (section.questions || [])) {
      const key = `${section.id}-${q.number - 1}`
      allQuestions.push({ section, passage: null, q, key })
    }
  }

  const filtered = allQuestions.filter(({ section, key }) => {
    if (activeSection && section.id !== activeSection) return false
    const userAns = answers[key]
    const isWrong = userAns !== allQuestions.find(x => x.key === key)?.q.correct
    if (filter === 'wrong') return isWrong
    if (filter === 'untagged') return isWrong && !errorTags[key]
    return true
  })

  const wrongCount = allQuestions.filter(({ key, q }) => answers[key] !== q.correct).length
  const taggedCount = allQuestions.filter(({ key }) => errorTags[key]).length

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">A</span>
          </div>
          <span className="font-semibold text-gray-900">Review — {test.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            {taggedCount}/{wrongCount} errors tagged
          </span>
          <button
            onClick={resetToHome}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <Home size={14} />
            Home
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-8 py-8">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'wrong', label: `Wrong (${wrongCount})` },
              { key: 'untagged', label: 'Untagged' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === f.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveSection(null)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                !activeSection ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
              }`}
            >
              All Sections
            </button>
            {test.sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(activeSection === s.id ? null : s.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === s.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                }`}
              >
                {SECTION_LABELS[s.id]}
              </button>
            ))}
          </div>
        </div>

        {/* Progress */}
        {wrongCount > 0 && (
          <div className="mb-6 bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500">Errors reviewed</span>
              <span className="font-semibold text-gray-900">{taggedCount}/{wrongCount}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-black h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${wrongCount > 0 ? (taggedCount / wrongCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Question list */}
        <div className="space-y-2">
          {filtered.map(({ section, passage, q, key }) => (
            <ReviewCard
              key={key}
              questionKey={key}
              section={section}
              passage={passage}
              q={q}
              userAnswer={answers[key]}
              errorTag={errorTags[key]}
              mindsetNote={mindsetNotes[key]}
              isExpanded={expandedKey === key}
              onToggle={() => setExpandedKey(expandedKey === key ? null : key)}
              onTagSelect={(tag) => setErrorTag(key, tag)}
              onNoteChange={(note) => setMindsetNote(key, note)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            No questions match this filter.
          </div>
        )}
      </div>
    </div>
  )
}

function ReviewCard({ questionKey, section, passage, q, userAnswer, errorTag, mindsetNote, isExpanded, onToggle, onTagSelect, onNoteChange }) {
  const isCorrect = userAnswer === q.correct
  const noAnswer = !userAnswer

  return (
    <div className={`border rounded-2xl transition-all ${
      isCorrect ? 'border-gray-200' : 'border-red-100'
    } ${isExpanded ? 'shadow-sm' : ''}`}>
      {/* Row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 text-left"
      >
        {/* Status icon */}
        <div className="flex-shrink-0">
          {isCorrect ? (
            <CheckCircle2 size={20} className="text-green-500" />
          ) : noAnswer ? (
            <Minus size={20} className="text-gray-300" />
          ) : (
            <XCircle size={20} className="text-red-400" />
          )}
        </div>

        {/* Question info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {SECTION_LABELS[section.id]} Q{q.number}
            </span>
            {passage && <span className="text-xs text-gray-300">· {passage.title}</span>}
            {!isCorrect && errorTag && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                errorTag === 'conceptual' ? 'bg-blue-50 text-blue-600' :
                errorTag === 'silly' ? 'bg-yellow-50 text-yellow-600' :
                'bg-purple-50 text-purple-600'
              }`}>
                {errorTag === 'conceptual' ? 'Conceptual' : errorTag === 'silly' ? 'Silly Mistake' : 'Strategy'}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700 truncate">{q.stem}</p>
        </div>

        {/* Answer summary */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {!isCorrect && (
            <div className="text-right">
              {userAnswer && (
                <div className="text-xs text-red-400 font-medium">You: {userAnswer}</div>
              )}
              <div className="text-xs text-green-600 font-medium">Ans: {q.correct}</div>
            </div>
          )}
          {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {/* Expanded */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-4">
          {/* Choices */}
          <div className="space-y-2 mb-4">
            {Object.entries(q.choices).map(([letter, text]) => {
              const isRight = letter === q.correct
              const isUser = letter === userAnswer
              return (
                <div
                  key={letter}
                  className={`answer-choice text-sm ${
                    isRight ? 'correct' : isUser && !isRight ? 'incorrect' : ''
                  }`}
                  style={{ border: '1.5px solid', borderColor: isRight ? '#16a34a' : isUser ? '#dc2626' : '#e5e7eb', background: isRight ? '#dcfce7' : isUser && !isRight ? '#fee2e2' : 'transparent' }}
                >
                  <span className="font-bold w-5 flex-shrink-0">{letter}.</span>
                  <span>{text}</span>
                  {isRight && <span className="ml-auto text-xs font-semibold text-green-600">✓ Correct</span>}
                  {isUser && !isRight && <span className="ml-auto text-xs font-semibold text-red-500">✗ Your answer</span>}
                </div>
              )
            })}
          </div>

          {/* Error tag (only show if wrong) */}
          {!isCorrect && (
            <div className="mb-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Why did you miss this?
              </div>
              <div className="flex gap-2 flex-wrap">
                {ERROR_TAGS.map(({ key, label, desc }) => (
                  <button
                    key={key}
                    onClick={() => onTagSelect(key)}
                    title={desc}
                    className={`error-tag ${key} ${errorTag === key ? 'active' : ''}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mindset note */}
          {!isCorrect && (
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Next time I will...
              </div>
              <textarea
                className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                rows={3}
                placeholder="How will you approach this differently? Write your mindset shift..."
                value={mindsetNote || ''}
                onChange={e => onNoteChange(e.target.value)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
