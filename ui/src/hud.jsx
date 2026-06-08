import React from 'react';
import { createRoot } from 'react-dom/client';

import HUD from './components/HUD.jsx';

import './styles/global.css';

const root = document.getElementById('root');
if (root) createRoot(root).render(<React.StrictMode><HUD /></React.StrictMode>);
