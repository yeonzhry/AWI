import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Main from './Pages/Main';
import Archive from './Pages/Archive';
import About from './Pages/About';
import Interviews from './Pages/Interviews';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/archive" element={<Archive />} />
        <Route path="/about" element={<About />} />
        <Route path="/interviews" element={<Interviews />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
