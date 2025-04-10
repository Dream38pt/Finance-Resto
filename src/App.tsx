import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import { MenuProvider } from './contexts/MenuContext';
import { ToastProvider } from './contexts/ToastContext';

function App() {
  return (
    <ToastProvider>
      <MenuProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </Router>
      </MenuProvider>
    </ToastProvider>
  );
}

export default App;
