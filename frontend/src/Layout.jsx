
import { Outlet } from 'react-router-dom'
import Header from './Components/Header'
import Footer from './Components/Footer'

const Layout = () => {
  return (
    <>
      <Header />
      <main className="main">
        <Outlet /> {}
      </main>
      <Footer />
    </>
  )
}

export default Layout