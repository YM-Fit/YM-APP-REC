// Entry point for the React version of the studio app.
// We import React and ReactDOM from skypack CDN. This allows the app to run
// in the browser without a build step. The App component is defined in
// ./App.jsx and encapsulates all of the application logic and routing.

import React from 'https://cdn.skypack.dev/react@18.2.0';
import { createRoot } from 'https://cdn.skypack.dev/react-dom@18.2.0/client';
import App from './App.jsx';

// Grab the root element defined in public/index.html
const container = document.getElementById('root');

// Initialize React root and render the App component.
const root = createRoot(container);
root.render(<App />);