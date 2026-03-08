import { PostHogProvider } from 'posthog-js/react';
import { BrowserRouter, useRoutes } from 'react-router-dom';
import { posthog } from './lib/posthog';
import { routes } from './routes';
import AuthProvider from './shared/components/AuthProvider';

function AppRoutes() {
  return useRoutes(routes);
}

export default function App() {
  return (
    <PostHogProvider client={posthog}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </PostHogProvider>
  );
}
