import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/learnings.css';
import Learnings from './components/Learnings.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Learnings />
  </StrictMode>
);
