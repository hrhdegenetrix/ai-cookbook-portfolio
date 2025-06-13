import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error details
    console.error('🚨 React Error Boundary caught an error:', error);
    console.error('🚨 Error Info:', errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="error-boundary">
          <div className="error-container">
            <div className="error-icon">
              <AlertCircle size={48} color="#e53e3e" />
            </div>
            <h2>Oops! Something went wrong</h2>
            <p>The app encountered an unexpected error. Don't worry, your data is safe!</p>
            
            <div className="error-actions">
              <button
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                <RefreshCcw size={16} />
                Reload App
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              >
                Try Again
              </button>
            </div>
            
            <details className="error-details">
              <summary>Technical Details (for debugging)</summary>
              <div className="error-info">
                <h4>Error:</h4>
                <pre>{this.state.error && this.state.error.toString()}</pre>
                <h4>Component Stack:</h4>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </div>
            </details>
          </div>
          

        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 