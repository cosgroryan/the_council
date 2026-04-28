import { useEffect, useRef } from 'react';
import Markdown from './Markdown';

export default function CouncillorDrawer({ councillor, response, onClose }) {
  const isOpen = !!councillor;
  // Keep last seen values so content stays visible during the slide-out animation
  const lastCouncillor = useRef(councillor);
  const lastResponse = useRef(response);
  if (councillor) {
    lastCouncillor.current = councillor;
    lastResponse.current = response;
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-xl bg-council-surface border-l border-council-border z-50 flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {lastCouncillor.current && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-council-border flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{lastCouncillor.current.emoji}</span>
                <div>
                  <div className="text-sm font-semibold text-council-text">{lastCouncillor.current.name}</div>
                  <div className="text-xs text-council-text-muted mt-0.5">Individual Assessment</div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-council-text-dim hover:text-council-text transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {!lastResponse.current || lastResponse.current.status === 'waiting' ? (
                <div className="flex items-center gap-2 text-council-text-muted text-sm">
                  <Spinner className="w-4 h-4" />
                  Awaiting response...
                </div>
              ) : lastResponse.current.status === 'error' ? (
                <div className="text-council-red text-sm bg-council-red/5 border border-council-red/20 rounded-lg p-4">
                  <div className="font-medium mb-1">Error</div>
                  <div className="text-council-text-muted">{lastResponse.current.content}</div>
                </div>
              ) : (
                <Markdown text={lastResponse.current.content} />
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Spinner({ className }) {
  return (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
