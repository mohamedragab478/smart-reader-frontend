import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ArticleHub from './components/ArticleHub';
import LandingPage from './components/LandingPage';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<ArticleHub />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
