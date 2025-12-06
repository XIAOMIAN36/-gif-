import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

// Simple Error Boundary to catch render errors
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Remove loader if it exists so we can see the error
      const loader = document.getElementById('loader');
      if (loader) loader.style.display = 'none';

      return (
        <div style={{
          height: '100vh', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: '#ef4444',
          fontFamily: 'sans-serif',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{fontSize: '1.5rem', marginBottom: '1rem'}}>Something went wrong.</h2>
          <pre style={{
            backgroundColor: '#1e293b', 
            padding: '1rem', 
            borderRadius: '0.5rem', 
            color: '#cbd5e1', 
            maxWidth: '800px',
            overflow: 'auto'
          }}>
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );

    // Remove the initial loader once React successfully mounts
    // We use a slight delay to ensure the App component has likely rendered its first frame
    const loader = document.getElementById('loader');
    if (loader) {
      setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => {
          if (loader.parentNode) {
            loader.parentNode.removeChild(loader);
          }
        }, 500);
      }, 200);
    }
  } catch (err) {
    console.error("Root mount failed", err);
    if (rootElement) {
        rootElement.innerHTML = `<div style="color:red;padding:20px;">Failed to start application: ${err}</div>`;
    }
  }
}