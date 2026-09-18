import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import './index.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

if (!googleClientId) {
  console.error('Google authentication is unavailable: VITE_GOOGLE_CLIENT_ID is not configured.');
}

if (googleClientId && !googleClientId.endsWith('.apps.googleusercontent.com')) {
  console.error('Google authentication is unavailable: VITE_GOOGLE_CLIENT_ID is not a Web OAuth client ID.');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <App />
  </GoogleOAuthProvider>
);
