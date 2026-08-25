import { Route, Routes } from 'react-router-dom';
import { Navigator } from './components/Navigator';
import { ToastHost, Confetti } from './components/Chrome';
import Matrix from './routes/Matrix';
import LayoutRoute from './routes/LayoutRoute';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Navigator />
      <div className="min-w-0 flex-1">
        <Routes>
          <Route path="/" element={<Matrix />} />
          <Route path="/:layoutId" element={<LayoutRoute />} />
        </Routes>
      </div>
      <ToastHost />
      <Confetti />
    </div>
  );
}
