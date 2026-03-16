import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { TripTrackerPage } from './components/TripTracker/TripTrackerPage'
import { TripHistoryPage } from './components/TripHistory/TripHistoryPage'
import { TripDetailsPage } from './components/TripDetails/TripDetailsPage'
import { useTelegram } from './hooks/useTelegram'

function AppShell() {
  const { colorScheme } = useTelegram()

  return (
    <div
      className="h-full"
      data-theme={colorScheme}
    >
      <Routes>
        <Route path="/" element={<TripTrackerPage />} />
        <Route path="/history" element={<TripHistoryPage />} />
        <Route path="/trip/:id" element={<TripDetailsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
