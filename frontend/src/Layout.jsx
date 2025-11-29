import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import Header from './Components/Header';
import Footer from './Components/Footer';
import { AuthProvider } from './Components/Auth/AuthContext';
import { RetrievalScopeProvider } from './contexts/RetrievalScopeContext';
import { SettingsModalProvider } from './contexts/SettingsModalContext';
import HeaderDashboard from './Components/HeaderDashboard';
import HeaderWorkspace from './Components/HeaderWorkspace';
import AgentSettingsModal from './Components/Kira/AgentSettingsModal/AgentSettingsModal';

const Layout = () => {
  React.useEffect(() => {
    const lenis = new Lenis({
      smooth: true,
      lerp: 0.1,
      autoRaf: false,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  const location = useLocation();
  let headerType = 'default';
  if (location.pathname.startsWith('/dashboard')) {
    headerType = 'dashboard';
  } else if (location.pathname.startsWith('/workspace')) {
    headerType = 'workspace';
  }

  let headerElement = <Header />;
  if (headerType === 'dashboard') headerElement = <HeaderDashboard />;
  else if (headerType === 'workspace') headerElement = <HeaderWorkspace />;

  // Hide footer on workspace, dashboard, and create-project routes
  const shouldShowFooter = !(
    location.pathname.startsWith('/workspace') ||
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/create-project')
  );

  return (
    <AuthProvider>
      <RetrievalScopeProvider>
        <SettingsModalProvider>
          {headerElement}
          <main className="main">
            <Outlet />
          </main>
          {shouldShowFooter && <Footer />}
          <AgentSettingsModal />
        </SettingsModalProvider>
      </RetrievalScopeProvider>
    </AuthProvider>
  );
};

export default Layout;
