import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/responsive.css'

// Build version indicator - moved to App component to avoid module-level execution

// Ensure dark mode is always active for corporate theme
document.documentElement.classList.add('dark');
document.body.classList.add('dark', 'bg-gradient-corporate');

createRoot(document.getElementById("root")!).render(<App />);
