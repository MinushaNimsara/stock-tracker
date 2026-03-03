import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import StoreEntry from './pages/StoreEntry';
import MonthlyReport from './pages/MonthlyReport';
import AdminUpload from './pages/AdminUpload';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<StoreEntry />} />
        <Route path="/report" element={<MonthlyReport />} />
        <Route path="/admin" element={<AdminUpload />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

