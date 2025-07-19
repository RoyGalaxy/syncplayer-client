import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import eruda from 'eruda';
import Home from './pages/Home';

if (process.env.NODE_ENV === 'development') {
  eruda.init();
}

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
    <Home />
  // </React.StrictMode>
);
