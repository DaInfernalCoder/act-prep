import { useTestStore } from '../store/useTestStore'
import { X } from 'lucide-react'

export default function QuestionIndex({ questions, sectionId, onClose }) {
  const { answers, flagged, currentQuestionIndex, setQuestion } = useTestStore()

  return (
    <div className="w-72 bg-white border-l border-gray-100 flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <span className="font-semibold text-gray-900 text-sm">Question Index</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
          <X size={16} />
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-xs text-gray-400 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-gray-100 border border-gray-200 inline-block" />
            Blank
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-black inline-block" />
            Answered
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-yellow-100 border border-yellow-400 inline-block" />
            Flagged
          </span>
        </div>

        {/* Grid */}
        <div className="flex flex-wrap gap-2">
          {questions.map((q, i) => {
            const key = `${sectionId}-${i}`
            const hasAnswer = !!answers[key]
            const isFlagged = !!flagged[key]
            const isCurrent = i === currentQuestionIndex

            let dotClass = 'blank'
            if (isFlagged) dotClass = 'flagged'
            else if (hasAnswer) dotClass = 'answered'
            if (isCurrent) dotClass += ' current'

            return (
              <button
                key={i}
                onClick={() => { setQuestion(i); onClose() }}
                className={`q-dot ${dotClass}`}
                title={`Question ${q.number}`}
              >
                {q.number}
              </button>
            )
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Answered</span>
            <span className="font-semibold text-gray-900">
              {questions.filter((_, i) => answers[`${sectionId}-${i}`]).length}/{questions.length}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Blank</span>
            <span className="font-semibold text-gray-900">
              {questions.filter((_, i) => !answers[`${sectionId}-${i}`]).length}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Flagged</span>
            <span className="font-semibold text-yellow-600">
              {questions.filter((_, i) => flagged[`${sectionId}-${i}`]).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
