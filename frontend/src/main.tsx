import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';
import { isMockEnabled, setupMockAdapter } from './mock';
import { apiClient } from './services/axios';

// Wire up mock adapter when VITE_MOCK_API=true
if (isMockEnabled()) {
  setupMockAdapter(apiClient);
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(<App />);
