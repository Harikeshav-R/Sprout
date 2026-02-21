import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import Navigation from './components/Navigation';
import LandingPage from './pages/LandingPage';
import DiscoveryPage from './pages/DiscoveryPage';
import DashboardPage from './pages/DashboardPage';

gsap.registerPlugin(ScrollTrigger);

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/dashboard' || location.pathname === '/discovery') {
      ScrollTrigger.getAll().forEach(st => st.kill());
    } else {
      ScrollTrigger.refresh();
    }
  }, [location.pathname]);

  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/discovery" element={<DiscoveryPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </>
  );
}

function App() {
  useEffect(() => {
    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  return (
    <Router>
      <div className="relative bg-sprout-cream min-h-screen">
        <AppContent />
      </div>
    </Router>
  );
}

export default App;
