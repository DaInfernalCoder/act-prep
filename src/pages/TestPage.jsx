import { useState } from 'react'
import { useTestStore } from '../store/useTestStore'
import Timer from '../components/Timer'
import QuestionIndex from '../components/QuestionIndex'
import EnglishPassage from '../components/EnglishPassage'
import ReadingPassage from '../components/ReadingPassage'
import ImagePassage from '../components/ImagePassage'
import { Flag, List, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import tests from '../data'

const SECTION_LABELS = { english: 'English', math: 'Mathematics', reading: 'Reading', science: 'Science' }

export default function TestPage() {
  const {
    activeTestId, currentSection, currentQuestionIndex,
    answers, flagged, setAnswer, toggleFlag, setQuestion, submitSection
  } = useTestStore()

  const [showIndex, setShowIndex] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [timerHidden, setTimerHidden] = useState(false)

  const test = tests.find(t => t.id === activeTestId)
  const section = test?.sections.find(s => s.id === currentSection)
  if (!section) return null

  // Flatten questions for this section
  const allQuestions = []
  if (section.passages) {
    for (const passage of section.passages) {
      for (const q of passage.questions) {
        allQuestions.push({ q, passage })
      }
    }
  } else if (section.questions) {
    for (const q of section.questions) {
      allQuestions.push({ q, passage: null })
    }
  }

  const total = allQuestions.length
  const current = allQuestions[currentQuestionIndex]
  if (!current) return null

  const { q, passage } = current
  const questionKey = `${currentSection}-${currentQuestionIndex}`
  const selectedAnswer = answers[questionKey]
  const isFlagged = flagged[questionKey]
  const answeredCount = allQuestions.filter((_, i) => answers[`${currentSection}-${i}`]).length

  const goTo = (idx) => {
    if (idx >= 0 && idx < total) setQuestion(idx)
  }

  const choiceLetters = currentSection === 'math' || currentSection === 'science'
    ? ['A', 'B', 'C', 'D'] // some science uses F/G/H/J too
    : ['A', 'B', 'C', 'D']

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-900">
            {SECTION_LABELS[currentSection]} Test
          </div>
          <button
            className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 hover:text-gray-600 transition-colors"
            onClick={() => {}} // directions modal (future)
          >
            Directions ↓
          </button>
        </div>

        {/* Center timer */}
        <div className="flex flex-col items-center">
          <Timer hidden={timerHidden} />
          <button
            onClick={() => setTimerHidden(!timerHidden)}
            className="text-[11px] text-gray-400 mt-0.5 border border-gray-200 rounded-full px-3 py-0.5 hover:bg-gray-50 transition-colors"
          >
            {timerHidden ? 'Show' : 'Hide'}
          </button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            Answered <span className="font-semibold text-gray-700">{answeredCount}</span> of{' '}
            <span className="font-semibold text-gray-700">{total}</span>
          </span>
          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="text-sm font-semibold border border-gray-200 px-4 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
          >
            End Section
          </button>
          <button
            onClick={() => setShowIndex(!showIndex)}
            className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              showIndex ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <List size={15} />
            Index
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left pane: passage */}
        <div className="flex-1 border-r border-gray-100 overflow-hidden">
          {currentSection === 'english' && passage && (
            <EnglishPassage passage={passage} activeUnderline={q.underlineNum} />
          )}
          {currentSection === 'reading' && passage && (
            <ReadingPassage passage={passage} lineRef={q.lineRef} />
          )}
          {currentSection === 'math' && q.imageSrc && (
            <MathPageView imageSrc={q.imageSrc} questionNum={q.number} />
          )}
          {currentSection === 'science' && (
            <ImagePassage
              imageSrc={passage?.imageSrc}
              questionImageSrc={q.imageSrc}
            />
          )}
        </div>

        {/* Right pane: question */}
        <div className="w-[480px] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8">
            {/* Item number + flag */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-medium text-gray-400">Item {q.number}</span>
              <button
                onClick={() => toggleFlag(questionKey)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  isFlagged
                    ? 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                    : 'text-gray-400 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Flag size={13} fill={isFlagged ? 'currentColor' : 'none'} />
                {isFlagged ? 'Flagged' : 'Flag'}
              </button>
            </div>

            {/* Question stem */}
            {q.imageSrc && currentSection !== 'math' ? (
              <img src={q.imageSrc} alt="Question" className="w-full mb-4 rounded-lg" />
            ) : null}
            <p className="text-gray-800 text-[15px] leading-relaxed mb-6">{q.stem}</p>

            {/* Answer choices */}
            <div className="space-y-2.5">
              {Object.entries(q.choices).map(([letter, text]) => {
                const isSelected = selectedAnswer === letter
                return (
                  <button
                    key={letter}
                    onClick={() => setAnswer(questionKey, letter)}
                    className={`answer-choice w-full text-left ${isSelected ? 'selected' : ''}`}
                  >
                    <span className={`font-bold text-sm flex-shrink-0 w-6 ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                      {letter}.
                    </span>
                    <span className="text-sm flex-1">{text}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Navigation bar */}
          <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
            {/* Mini dot nav */}
            <div className="flex gap-1.5 overflow-x-auto max-w-[220px]">
              {allQuestions.slice(
                Math.max(0, currentQuestionIndex - 4),
                Math.min(total, currentQuestionIndex + 5)
              ).map((_, i) => {
                const realIdx = Math.max(0, currentQuestionIndex - 4) + i
                const key = `${currentSection}-${realIdx}`
                const hasAns = !!answers[key]
                const isFl = !!flagged[key]
                const isCurr = realIdx === currentQuestionIndex
                let cls = 'blank'
                if (isFl) cls = 'flagged'
                else if (hasAns) cls = 'answered'
                if (isCurr) cls += ' current'
                return (
                  <button
                    key={realIdx}
                    onClick={() => setQuestion(realIdx)}
                    className={`q-dot ${cls} flex-shrink-0`}
                    style={{ width: 24, height: 24, fontSize: 10 }}
                  >
                    {realIdx + 1}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => goTo(currentQuestionIndex - 1)}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-1 text-sm font-semibold text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button
                onClick={() => goTo(currentQuestionIndex + 1)}
                disabled={currentQuestionIndex === total - 1}
                className="flex items-center gap-1 text-sm font-semibold text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Index sidebar */}
        {showIndex && (
          <QuestionIndex
            questions={allQuestions.map(x => x.q)}
            sectionId={currentSection}
            onClose={() => setShowIndex(false)}
          />
        )}
      </div>

      {/* Submit confirm modal */}
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
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle size={22} className="text-amber-500" />
          <h2 className="text-lg font-bold text-gray-900">End this section?</h2>
        </div>
        <p className="text-gray-500 text-sm mb-2">
          You've answered <strong className="text-gray-900">{answered} of {total}</strong> questions.
        </p>
        {unanswered > 0 && (
          <p className="text-amber-600 text-sm mb-6">
            {unanswered} question{unanswered > 1 ? 's' : ''} unanswered. You cannot return to this section.
          </p>
        )}
        {unanswered === 0 && (
          <p className="text-green-600 text-sm mb-6">All questions answered. </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Keep Working
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            Submit Section
          </button>
        </div>
      </div>
    </div>
  )
}
