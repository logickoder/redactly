import { HashRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Redact from './pages/Redact';
import History from './pages/History';
import Mappings from './pages/Mappings';
import Feedback from './pages/Feedback';
import { ToastProvider } from './context/ToastContext';
import type { FC } from 'react';
import ScrollToTop from './components/ScrollToTop.tsx';

const App: FC = () => {
  return (
    <ToastProvider>
      <HashRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="redact" element={<Redact />} />
            <Route path="history" element={<History />} />
            <Route path="mappings" element={<Mappings />} />
            <Route path="feedback" element={<Feedback />} />
          </Route>
        </Routes>
      </HashRouter>
    </ToastProvider>
  );
};

export default App;
