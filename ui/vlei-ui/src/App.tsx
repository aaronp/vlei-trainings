import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { IssueVLEI } from './components/IssueVLEI';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/issue" element={<IssueVLEI />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
