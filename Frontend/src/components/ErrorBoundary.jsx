import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-base-100">
          <div className="card w-full max-w-md bg-base-200 shadow-xl border border-error/20">
            <div className="card-body text-center">
              <h2 className="card-title justify-center text-error">Something went wrong</h2>
              <p className="text-sm opacity-80 my-2">
                An unexpected error occurred while rendering this component.
              </p>
              {this.state.error?.message && (
                <div className="bg-base-300 p-3 rounded font-mono text-xs text-left overflow-x-auto my-2 text-error">
                  {this.state.error.message}
                </div>
              )}
              <div className="card-actions justify-center mt-4 gap-3">
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={this.handleReset}
                >
                  Reload Page
                </button>
                <a 
                  href="/" 
                  className="btn btn-ghost btn-sm"
                >
                  Go to Home
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
