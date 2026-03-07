import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App.tsx';
import './styles/index.css';

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual'; // Tắt chế độ tự nhớ vị trí cuộn của trình duyệt
}
createRoot(document.getElementById('root')!).render(

  <StrictMode>
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </StrictMode>
);
