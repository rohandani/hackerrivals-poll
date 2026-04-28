import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import PollPage from './components/PollPage';
import CreatePollPage from './components/CreatePollPage';
import PollsListPage from './components/PollsListPage';
import AdminGate from './components/AdminGate';
import ErrorPage from './components/ErrorPage';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={
              <AdminGate>
                <PollsListPage />
              </AdminGate>
            }
          />
          <Route
            path="/polls"
            element={
              <AdminGate>
                <PollsListPage />
              </AdminGate>
            }
          />
          <Route
            path="/create"
            element={
              <AdminGate>
                <CreatePollPage />
              </AdminGate>
            }
          />
          <Route path="/poll/:pollId" element={<PollPage />} />
          <Route path="*" element={<ErrorPage type="not-found" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
