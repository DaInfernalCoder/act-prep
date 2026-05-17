import { useEffect } from 'react'
import { useTestStore } from './store/useTestStore'
import { supabase } from './lib/supabase'
import Dashboard from './pages/Dashboard'
import Instructions from './pages/Instructions'
import TestPage from './pages/TestPage'
import BreakScreen from './pages/BreakScreen'
import Results from './pages/Results'
import ReviewPage from './pages/ReviewPage'

// Load results from Supabase on startup
async function loadResults() {
  const { data } = await supabase
    .from('act_test_results')
    .select('*')
    .order('created_at', { ascending: true })
  if (!data) return
  const results = data.map(r => ({
    id: r.id,
    testId: r.test_id,
    date: r.created_at,
    scores: r.scores,
    answers: r.answers,
    errorTags: r.error_tags,
    mindsetNotes: r.mindset_notes,
  }))
  useTestStore.setState({ testResults: results })
}

export default function App() {
  const phase = useTestStore(s => s.phase)

  useEffect(() => { loadResults() }, [])

  return (
    <div className="fade-in">
      {phase === 'dashboard' && <Dashboard />}
      {phase === 'instructions' && <Instructions />}
      {phase === 'testing' && <TestPage />}
      {phase === 'break' && <BreakScreen />}
      {phase === 'results' && <Results />}
      {phase === 'review' && <ReviewPage />}
    </div>
  )
}
