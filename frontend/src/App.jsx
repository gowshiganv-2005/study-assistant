import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Study from './pages/Study';
import Quiz from './pages/Quiz';
import useStudyStore from './store/studyStore';

function App() {
  const curriculum = useStudyStore(s => s.curriculum);

  return (
    <BrowserRouter>
      <div className="bg-orbs" aria-hidden="true" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/study"
          element={curriculum ? <Study /> : <Navigate to="/" replace />}
        />
        <Route
          path="/quiz"
          element={curriculum ? <Quiz /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
