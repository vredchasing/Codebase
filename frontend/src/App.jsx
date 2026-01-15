import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './Layout'
import LandingPage from './Components/LandingPageContent/LandingPage'
import Sandbox from './Components/Sandbox/SandboxContent/Sandbox'
import Kira from './Components/Kira/Kira'
import SignUp from './Components/Auth/SignUp'
import Login from './Components/Auth/Login'
import Dashboard from './Components/dashboard/Dashboard'
import ProjectCreator from './Components/projectsPipeline/ProjectCreator'
import LoadingAnimation from './Components/animationAssests/loadingAnimation'

export default function App() {
  return ( 
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} /> {/* This is your main page content */}
          <Route path="workspace/:projectId" element={<Sandbox></Sandbox>} />
          <Route path="kira" element = {<Kira></Kira>}/>
          <Route path="signup" element={<SignUp></SignUp>} />
          <Route path="login" element={<Login></Login>} />
          <Route path="dashboard" element={<Dashboard></Dashboard>} />
          <Route path="create-project" element={<ProjectCreator></ProjectCreator>} />
          <Route path="uitest" element={<LoadingAnimation></LoadingAnimation>} />
          <Route path="*" element={<div>404 Not Found</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
