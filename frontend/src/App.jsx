import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './Layout'
import LandingPage from './Components/LandingPageContent/LandingPage'
import Sandbox from './Components/Sandbox/Sandbox'
import Kira from './Components/Kira/Kira'

export default function App() {
  return ( 
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} /> {/* This is your main page content */}
          <Route path="workspace" element={<Sandbox></Sandbox>} /> {/* Placeholder for Login Page */}
          <Route path="kira" element = {<Kira></Kira>}/>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
