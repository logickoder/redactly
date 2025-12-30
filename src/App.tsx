import { HashRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Redact from './pages/Redact';
import History from './pages/History';
import Mappings from './pages/Mappings';
import type { FC } from 'react';

const App: FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="redact" element={<Redact />} />
          <Route path="history" element={<History />} />
          <Route path="mappings" element={<Mappings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;
