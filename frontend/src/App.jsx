import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './Components/Layout'
import LandingPage from './Components/LandingPage'  // or from your pages folder

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} /> {/* This is your main page content */}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
