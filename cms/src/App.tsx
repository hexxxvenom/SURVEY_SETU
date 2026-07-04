import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Surveys } from './pages/Surveys';
import { SurveyEditor } from './pages/SurveyEditor';
import { Users } from './pages/Users';
import { Devices } from './pages/Devices';
import { Responses } from './pages/Responses';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="responses" element={<Responses />} />
          <Route path="surveys" element={<Surveys />} />
          <Route path="surveys/new" element={<SurveyEditor />} />
          <Route path="surveys/:id/edit" element={<SurveyEditor />} />
          <Route path="users" element={<Users />} />
          <Route path="devices" element={<Devices />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
