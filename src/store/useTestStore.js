import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const SECTION_ORDER = ['english', 'math', 'reading']
const SECTION_TIMES = { english: 45 * 60, math: 60 * 60, reading: 35 * 60 }
const BREAK_AFTER = 'math'
const BREAK_TIME = 10 * 60

export const useTestStore = create(
  persist(
    (set, get) => ({
      // Session state
      activeTestId: null,
      currentSection: null,
      currentQuestionIndex: 0,
      answers: {},        // { 'english-0': 'A', 'math-3': 'F', ... }
      flagged: {},        // { 'english-0': true }
      timeRemaining: null,
      phase: 'dashboard', // dashboard | instructions | testing | break | review | results
      breakTimeRemaining: BREAK_TIME,

      // Review state (post-test)
      errorTags: {},       // { 'english-0': 'conceptual' | 'silly' | 'strategy' }
      mindsetNotes: {},    // { 'english-0': 'next time I will...' }

      // Historical results
      testResults: [],     // [{ testId, date, scores, errorTags, mindsetNotes }]

      // Actions
      startTest: (testId) => set({
        activeTestId: testId,
        currentSection: 'english',
        currentQuestionIndex: 0,
        answers: {},
        flagged: {},
        timeRemaining: SECTION_TIMES['english'],
        phase: 'instructions',
        breakTimeRemaining: BREAK_TIME,
        errorTags: {},
        mindsetNotes: {},
      }),

      beginSection: () => set((state) => ({
        phase: 'testing',
        timeRemaining: SECTION_TIMES[state.currentSection],
      })),

      setAnswer: (key, value) => set((state) => ({
        answers: { ...state.answers, [key]: value }
      })),

      toggleFlag: (key) => set((state) => ({
        flagged: { ...state.flagged, [key]: !state.flagged[key] }
      })),

      setQuestion: (index) => set({ currentQuestionIndex: index }),

      tickTimer: () => {
        const { timeRemaining, submitSection } = get()
        if (timeRemaining <= 0) {
          submitSection()
        } else {
          set({ timeRemaining: timeRemaining - 1 })
        }
      },

      tickBreak: () => {
        const { breakTimeRemaining } = get()
        if (breakTimeRemaining <= 0) {
          get().endBreak()
        } else {
          set({ breakTimeRemaining: breakTimeRemaining - 1 })
        }
      },

      submitSection: () => {
        const { currentSection } = get()
        const idx = SECTION_ORDER.indexOf(currentSection)
        if (idx === -1 || idx === SECTION_ORDER.length - 1) {
          get().finishTest()
          return
        }
        const nextSection = SECTION_ORDER[idx + 1]
        if (currentSection === BREAK_AFTER) {
          set({ phase: 'break', breakTimeRemaining: BREAK_TIME })
        } else {
          set({
            currentSection: nextSection,
            currentQuestionIndex: 0,
            timeRemaining: SECTION_TIMES[nextSection],
            phase: 'instructions',
          })
        }
      },

      endBreak: () => {
        const { currentSection } = get()
        const idx = SECTION_ORDER.indexOf(currentSection)
        const nextSection = SECTION_ORDER[idx + 1]
        set({
          currentSection: nextSection,
          currentQuestionIndex: 0,
          timeRemaining: SECTION_TIMES[nextSection],
          phase: 'instructions',
        })
      },

      finishTest: () => set({ phase: 'results' }),

      goToReview: () => set({ phase: 'review' }),

      setErrorTag: (key, tag) => set((state) => ({
        errorTags: { ...state.errorTags, [key]: state.errorTags[key] === tag ? null : tag }
      })),

      setMindsetNote: (key, note) => set((state) => ({
        mindsetNotes: { ...state.mindsetNotes, [key]: note }
      })),

      saveResults: (testData) => {
        const { activeTestId, answers, errorTags, mindsetNotes, testResults } = get()
        const scores = computeScores(testData, answers)
        const result = {
          testId: activeTestId,
          date: new Date().toISOString(),
          scores,
          errorTags,
          mindsetNotes,
          answers,
        }
        set({ testResults: [...testResults, result] })
        return result
      },

      resetToHome: () => set({
        activeTestId: null,
        currentSection: null,
        currentQuestionIndex: 0,
        answers: {},
        flagged: {},
        timeRemaining: null,
        phase: 'dashboard',
      }),
    }),
    {
      name: 'act-prep-store',
      partialize: (state) => ({
        testResults: state.testResults,
        // Don't persist in-progress test - require fresh start
      }),
    }
  )
)

export function computeScores(testData, answers) {
  const sectionScores = {}
  let totalCorrect = 0
  let totalQuestions = 0

  const activeSections = ['english', 'math', 'reading']
  for (const section of testData.sections.filter(s => activeSections.includes(s.id))) {
    let correct = 0
    let total = 0
    for (const passage of (section.passages || [])) {
      for (const q of (passage.questions || [])) {
        const key = `${section.id}-${q.number - 1}`
        if (answers[key] === q.correct) correct++
        total++
      }
    }
    for (const q of (section.questions || [])) {
      const key = `${section.id}-${q.number - 1}`
      if (answers[key] === q.correct) correct++
      total++
    }
    sectionScores[section.id] = { correct, total, pct: total ? Math.round(correct / total * 100) : 0 }
    totalCorrect += correct
    totalQuestions += total
  }

  const scaledScores = {}
  const scaleTable = testData.scaleTable || {}
  for (const [id, s] of Object.entries(sectionScores)) {
    scaledScores[id] = lookupScale(scaleTable[id], s.correct)
  }
  const composite = Math.round(
    Object.values(scaledScores).reduce((a, b) => a + b, 0) / Object.keys(scaledScores).length
  )

  return { sections: sectionScores, scaled: scaledScores, composite, totalCorrect, totalQuestions }
}

function lookupScale(table, raw) {
  if (!table) return fallbackScale(raw)
  // table is {rawScore: scaledScore}
  const keys = Object.keys(table).map(Number)
  if (keys.length === 0) return 1
  // Find exact or nearest
  const str = String(raw)
  if (table[str] !== undefined) return table[str]
  // Find closest raw
  const sorted = keys.sort((a, b) => a - b)
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i] <= raw) return table[sorted[i]]
  }
  return 1
}

function fallbackScale(raw) {
  if (raw >= 75) return 36
  const pct = raw / 75
  return Math.max(1, Math.min(36, Math.round(pct * 36)))
}

export { SECTION_ORDER, SECTION_TIMES }
