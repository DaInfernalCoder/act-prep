import { useTestStore } from '../store/useTestStore'
import { ChevronRight } from 'lucide-react'
import tests from '../data'

const SECTION_INFO = {
  english: { name: 'English', time: '45 min', questions: 75 },
  math:    { name: 'Mathematics', time: '60 min', questions: 60 },
  reading: { name: 'Reading', time: '35 min', questions: 40 },
  science: { name: 'Science', time: '35 min', questions: 40 },
}

export default function Instructions() {
  const { currentSection, activeTestId, beginSection } = useTestStore()
  const info = SECTION_INFO[currentSection]
  const test = tests.find(t => t.id === activeTestId)

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
          {test?.name}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">{info?.name}</h1>
        <p className="text-gray-400 mb-8">{info?.time} · {info?.questions} questions</p>

        {currentSection === 'science' && (
          <p className="text-sm text-red-500 mb-6">No calculator permitted</p>
        )}
        {currentSection === 'math' && (
          <p className="text-sm text-gray-500 mb-6">Calculator permitted</p>
        )}

        <button
          onClick={beginSection}
          className="w-full flex items-center justify-center gap-2 bg-black text-white py-4 rounded-2xl text-base font-semibold hover:bg-gray-800 transition-colors"
        >
          Start Timer
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
