import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import StoreEntry from './pages/StoreEntry';
import MonthlyReport from './pages/MonthlyReport';
import MonthlyReportExcelView from './pages/MonthlyReportExcelView';

<Route path="/report" element={<MonthlyReportExcelView />} />

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<StoreEntry />} />
        <Route path="/report" element={<MonthlyReport />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

