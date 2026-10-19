import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught rendering error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 m-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-600 flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-rose-900">
                Workspace Rendering Error
              </h2>
              <p className="text-xs text-rose-700 mt-1">
                A rendering exception occurred in this workspace view. The error was caught to prevent application blankout.
              </p>
              <div className="mt-3 p-3 rounded-lg bg-rose-100/80 font-mono text-xs text-rose-900 overflow-x-auto">
                {this.state.error?.message || String(this.state.error)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-rose-200">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Workspace</span>
            </button>
            {this.props.onGoHome && (
              <button
                onClick={this.props.onGoHome}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-300 transition"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return to Home</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
