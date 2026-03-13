import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { DevProvider } from './context/DevContext';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/organisms/ToastContainer';
import DevPanel from './components/organisms/DevPanel';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <DevProvider>
      <AppProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
            <ToastContainer />
            <DevPanel />
          </BrowserRouter>
        </ToastProvider>
      </AppProvider>
    </DevProvider>
  );
}
