import { useState } from 'react'
import { useTestStore } from '../store/useTestStore'
import Timer from '../components/Timer'
import QuestionIndex from '../components/QuestionIndex'
import { Flag, List, ChevronLeft, ChevronRight } from 'lucide-react'
import tests from '../data'

const SECTION_LABELS = { english: 'English', math: 'Mathematics', reading: 'Reading', science: 'Science' }

function getMathChoices(section, q) {
  if (section !== 'math') return Object.keys(q.choices)
  const isEven = q.number % 2 === 0
  const base = isEven ? ['F', 'G', 'H', 'J'] : ['A', 'B', 'C', 'D']
  const extra = isEven ? 'K' : 'E'
  if (q.correct === extra) return [...base, extra]
  return base
}

function PageImage({ src, alt }) {
  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-4">
      <img src={src} alt={alt || ''} className="w-full" draggable={false} />
    </div>
  )
}

export default function TestPage() {
  const {
    activeTestId, currentSection, currentQuestionIndex,
    answers, flagged, setAnswer, toggleFlag, setQuestion, submitSection
  } = useTestStore()

  const [showIndex, setShowIndex] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)

  const test = tests.find(t => t.id === activeTestId)
  const section = test?.sections.find(s => s.id === currentSection)
  if (!section) return null

  const allQuestions = []
  if (section.passages) {
    for (const passage of section.passages)
      for (const q of passage.questions)
        allQuestions.push({ q, passage })
  } else if (section.questions) {
    for (const q of section.questions)
      allQuestions.push({ q, passage: null })
  }

  const total = allQuestions.length
  const current = allQuestions[currentQuestionIndex]
  if (!current) return null

  const { q, passage } = current
  const questionKey = `${currentSection}-${currentQuestionIndex}`
  const selectedAnswer = answers[questionKey]
  const isFlagged = flagged[questionKey]
  const answeredCount = allQuestions.filter((_, i) => answers[`${currentSection}-${i}`]).length

  const goTo = (idx) => { if (idx >= 0 && idx < total) setQuestion(idx) }

  // Left pane image src — all sections use rendered page images
  // English: use per-question page image. Other sections: passage image first.
  const leftImageSrc = currentSection === 'english'
    ? (q.imageSrc || passage?.imageSrc || null)
    : (passage?.imageSrc || q.imageSrc || null)

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-900 w-48">
          {SECTION_LABELS[currentSection]}
        </div>
        <Timer />
        <div className="flex items-center gap-3 w-48 justify-end">
          <span className="text-sm text-gray-400">
            {answeredCount}<span className="text-gray-300"> / </span>{total}
          </span>
          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="text-sm font-semibold border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            End
          </button>
          <button
            onClick={() => setShowIndex(!showIndex)}
            className={`p-1.5 rounded-lg transition-colors ${showIndex ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
          >
            <List size={16} className="text-gray-500" />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: page image */}
        <div className="flex-1 border-r border-gray-100 overflow-hidden">
          {leftImageSrc
            ? <PageImage src={leftImageSrc} alt={`${currentSection} passage`} />
            : <div className="h-full flex items-center justify-center text-gray-300 text-sm">No content</div>
          }
        </div>

        {/* Right: question + choices */}
        <div className="w-[460px] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-7">
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-medium text-gray-400">Item {q.number}</span>
              <button
                onClick={() => toggleFlag(questionKey)}
                className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                  isFlagged ? 'bg-yellow-50 text-yellow-600 border border-yellow-200' : 'text-gray-400 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Flag size={12} fill={isFlagged ? 'currentColor' : 'none'} />
                {isFlagged ? 'Flagged' : 'Flag'}
              </button>
            </div>

            {currentSection !== 'math' && (
              <p className="text-gray-800 text-[15px] leading-relaxed mb-5">{q.stem}</p>
            )}

            <div className="space-y-2">
              {getMathChoices(currentSection, q).map((letter) => {
                const isSelected = selectedAnswer === letter
                return (
                  <button
                    key={letter}
                    onClick={() => setAnswer(questionKey, letter)}
                    className={`answer-choice w-full text-left ${isSelected ? 'selected' : ''}`}
                  >
                    <span className={`font-bold text-sm w-5 flex-shrink-0 ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                      {letter}.
                    </span>
                    {currentSection !== 'math' && (
                      <span className="text-sm flex-1">{q.choices[letter]}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Nav */}
          <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
            <button
              onClick={() => goTo(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-1 text-sm font-semibold text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span className="text-xs text-gray-400">{currentQuestionIndex + 1} / {total}</span>
            <button
              onClick={() => goTo(currentQuestionIndex + 1)}
              disabled={currentQuestionIndex === total - 1}
              className="flex items-center gap-1 text-sm font-semibold text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {showIndex && (
          <QuestionIndex
            questions={allQuestions.map(x => x.q)}
            sectionId={currentSection}
            onClose={() => setShowIndex(false)}
          />
        )}
      </div>

      {showSubmitConfirm && (
        <SubmitModal
          answered={answeredCount}
          total={total}
          onConfirm={() => { setShowSubmitConfirm(false); submitSection() }}
          onCancel={() => setShowSubmitConfirm(false)}
        />
      )}
    </div>
  )
}

function SubmitModal({ answered, total, onConfirm, onCancel }) {
  const unanswered = total - answered
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-7 max-w-sm w-full mx-4 shadow-xl">
        <h2 className="text-base font-bold text-gray-900 mb-2">End this section?</h2>
        <p className="text-gray-500 text-sm mb-1">
          {answered} of {total} answered.
        </p>
        {unanswered > 0 && (
          <p className="text-amber-600 text-sm mb-5">{unanswered} unanswered — cannot return.</p>
        )}
        {unanswered === 0 && <p className="text-green-600 text-sm mb-5">All answered.</p>}
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Keep Working
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800">
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}
