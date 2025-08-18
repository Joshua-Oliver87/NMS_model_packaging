import './Polyfills'; // Load polyfills
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Buffer } from "buffer";
import process from "process";
import { Readable, Writable } from "stream-browserify";
import { UserProvider } from './context/UserContext'; // Import UserContext
import { FarmsProvider } from './context/FarmsContext';

// Setup polyfills for global usage
window.Buffer = Buffer;
window.process = process;
window.Readable = Readable;
window.Writable = Writable;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <UserProvider> {/* Wrap the application with the UserProvider */}
      <FarmsProvider>
      <App />
      </FarmsProvider>
    </UserProvider>
  </React.StrictMode>
);

// Report web vitals (optional)
reportWebVitals();
