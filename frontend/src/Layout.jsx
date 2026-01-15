import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import Lenis from 'lenis';

import store, {persistor} from './stores/reduxTK/clientStore';

import Header from './Components/Header';
import Footer from './Components/Footer';
import HeaderDashboard from './Components/HeaderDashboard';
import HeaderWorkspace from './Components/HeaderWorkspace';
import AgentSettingsModal from './Components/Kira/AgentSettingsModal/AgentSettingsModal';

import { AuthProvider } from './Components/Auth/AuthContext';
import { RetrievalScopeProvider } from './contexts/RetrievalScopeContext';
import { SettingsModalProvider } from './contexts/SettingsModalContext';

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

  let headerElement = <Header />;
  if (location.pathname.startsWith('/dashboard')) {
    headerElement = <HeaderDashboard />;
  } else if (location.pathname.startsWith('/workspace')) {
    headerElement = <HeaderWorkspace />;
  }

  const shouldShowFooter = !(
    location.pathname.startsWith('/workspace') ||
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/create-project') ||
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/signup')
  );

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
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
      </PersistGate>
    </Provider>
  );
};

export default Layout;
