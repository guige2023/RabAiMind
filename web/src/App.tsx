import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Generator from './components/Generator';
import Result from './components/Result';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/generator/:taskId" element={<Generator />} />
        <Route path="/result/:taskId" element={<Result />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
