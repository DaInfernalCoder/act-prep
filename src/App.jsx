import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { useTestStore } from './store/useTestStore'
import Dashboard from './pages/Dashboard'
import Instructions from './pages/Instructions'
import TestPage from './pages/TestPage'
import BreakScreen from './pages/BreakScreen'
import Results from './pages/Results'
import ReviewPage from './pages/ReviewPage'
import LoginPage from './pages/LoginPage'

export default function App() {
  const phase = useTestStore(s => s.phase)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadCloudResults(session.user.id)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadCloudResults(session.user.id)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <LoginPage />
  if (!user) return <LoginPage />

  return (
    <div className="fade-in">
      {phase === 'dashboard' && <Dashboard user={user} />}
      {phase === 'instructions' && <Instructions />}
      {phase === 'testing' && <TestPage />}
      {phase === 'break' && <BreakScreen />}
      {phase === 'results' && <Results />}
      {phase === 'review' && <ReviewPage />}
    </div>
  )
}

async function loadCloudResults(userId) {
  const { data, error } = await supabase
    .from('act_test_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error || !data) return
  const results = data.map(r => ({
    testId: r.test_id,
    date: r.created_at,
    scores: r.scores,
    answers: r.answers,
    errorTags: r.error_tags,
    mindsetNotes: r.mindset_notes,
  }))
  useTestStore.setState({ testResults: results })
}
