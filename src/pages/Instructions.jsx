import { useTestStore } from '../store/useTestStore'
import { Clock, BookOpen, ChevronRight } from 'lucide-react'
import tests from '../data'

const SECTION_INFO = {
  english: {
    name: 'English Test',
    time: '45 minutes',
    questions: 75,
    directions: 'In the passages that follow, certain words and phrases are underlined and numbered. In the right column, you will find alternatives for each underlined part. Choose the best answer. If you think the original is best, choose "NO CHANGE."',
  },
  math: {
    name: 'Mathematics Test',
    time: '60 minutes',
    questions: 60,
    directions: 'Solve each problem, choose the correct answer, and fill in the corresponding oval. You may use a calculator. Do not spend too much time on any one problem.',
  },
  reading: {
    name: 'Reading Test',
    time: '35 minutes',
    questions: 40,
    directions: 'Each passage is accompanied by several questions. After reading each passage, choose the best answer to each question. You may refer to the passages as often as necessary.',
  },
  science: {
    name: 'Science Test',
    time: '35 minutes',
    questions: 40,
    directions: 'Each passage is followed by several questions. After reading each passage, choose the best answer. You may refer to the passages as often as necessary. You are NOT permitted to use a calculator on this test.',
  },
}

export default function Instructions() {
  const { currentSection, activeTestId, beginSection } = useTestStore()
  const info = SECTION_INFO[currentSection]
  const test = tests.find(t => t.id === activeTestId)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">A</span>
          </div>
          <span className="font-semibold text-gray-900">{test?.name}</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-xl w-full">
          {/* Section badge */}
          <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full text-sm font-medium mb-6">
            <BookOpen size={14} />
            {info?.name}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ready to begin?</h1>
          <p className="text-gray-500 mb-8">Read the directions below before starting your timer.</p>

          {/* Time + questions */}
          <div className="flex gap-4 mb-8">
            <div className="flex-1 bg-gray-50 rounded-2xl p-5 flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock size={18} className="text-white" />
              </div>
              <div>
                <div className="font-bold text-gray-900">{info?.time}</div>
                <div className="text-xs text-gray-400">time limit</div>
              </div>
            </div>
            <div className="flex-1 bg-gray-50 rounded-2xl p-5 flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">{info?.questions}</span>
              </div>
              <div>
                <div className="font-bold text-gray-900">{info?.questions} Questions</div>
                <div className="text-xs text-gray-400">in this section</div>
              </div>
            </div>
          </div>

          {/* Directions */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Directions</div>
            <p className="text-gray-700 leading-relaxed text-sm">{info?.directions}</p>
          </div>

          {currentSection === 'math' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-sm text-amber-800">
              <strong>Note:</strong> You may use a calculator on this section.
            </div>
          )}
          {currentSection === 'science' && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-sm text-red-800">
              <strong>Note:</strong> No calculator permitted on the Science Test.
            </div>
          )}

          <button
            onClick={beginSection}
            className="w-full flex items-center justify-center gap-2 bg-black text-white py-4 rounded-2xl text-base font-semibold hover:bg-gray-800 transition-colors"
          >
            Start Timer & Begin
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
