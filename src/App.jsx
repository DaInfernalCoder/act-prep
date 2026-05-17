import { useTestStore } from './store/useTestStore'
import Dashboard from './pages/Dashboard'
import Instructions from './pages/Instructions'
import TestPage from './pages/TestPage'
import BreakScreen from './pages/BreakScreen'
import Results from './pages/Results'
import ReviewPage from './pages/ReviewPage'

export default function App() {
  const phase = useTestStore(s => s.phase)

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
