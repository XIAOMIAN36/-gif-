import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // Manually remove loader if it exists (backup for React's own hydration)
  const loader = document.getElementById('loader');
  if (loader) {
    // Small delay to ensure paint
    setTimeout(() => {
      loader.style.opacity = '0';
      setTimeout(() => {
        loader.remove();
      }, 500);
    }, 100);
  }
} catch (error) {
  console.error("Failed to mount React app:", error);
  const loader = document.getElementById('loader');
  const errorDisplay = document.getElementById('error-display');
  if (loader && errorDisplay) {
    const spinner = loader.querySelector('.spinner');
    if (spinner) (spinner as HTMLElement).style.display = 'none';
    errorDisplay.style.display = 'block';
    errorDisplay.innerText = "Critical System Error: " + (error as Error).message;
  }
}