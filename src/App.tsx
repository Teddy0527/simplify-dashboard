import { BrowserRouter, useRoutes } from 'react-router-dom';
import { routes } from './routes';
import AuthProvider from './shared/components/AuthProvider';

function AppRoutes() {
  return useRoutes(routes);
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
