import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { IssueVLEI } from './components/IssueVLEI';
import { IssueCredential } from './components/IssueCredential';
import { Organizations } from './components/Organizations';
import { TailwindTest } from './components/TailwindTest';
import { Wizard } from './pages/Wizard';
import { IssuerWizard } from './pages/IssuerWizard';
import { HolderWizard } from './pages/HolderWizard';
import { SchemaManagement } from './components/SchemaManagement';
import { initializeDefaultSchemaService } from './services/schema';

const queryClient = new QueryClient();

// Initialize schema service on app startup
try {
  initializeDefaultSchemaService();
  console.log('Schema service initialized with localStorage provider');
} catch (error) {
  console.error('Failed to initialize schema service:', error);
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/issue" element={<IssueVLEI />} />
          <Route path="/issue-credential" element={<IssueCredential />} />
          <Route path="/organizations" element={<Organizations />} />
          <Route path="/test" element={<TailwindTest />} />
          <Route path="/wizard" element={<Wizard />} />
          <Route path="/wizard/issuer" element={<IssuerWizard />} />
          <Route path="/wizard/holder" element={<HolderWizard />} />
          <Route path="/schemas" element={<SchemaManagement />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
