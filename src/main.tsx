import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initPostHog, posthog } from './lib/posthog';
import { setEventTrackingListener } from '@jobsimplify/shared';
import './styles/global.css';

initPostHog();

setEventTrackingListener((eventType, metadata) => {
  posthog.capture(eventType, metadata);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
