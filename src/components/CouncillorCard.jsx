export default function CouncillorCard({ councillor, response, onClick }) {
  const status = response?.status ?? 'idle';
  const isClickable = status === 'ready' || status === 'error';

  return (
    <button
      onClick={() => isClickable && onClick(councillor.id)}
      disabled={!isClickable}
      className={`
        group relative flex flex-col p-4 rounded-lg border text-left transition-all duration-200
        bg-council-card border-council-border
        ${isClickable
          ? 'hover:border-council-border-light hover:bg-council-card-hover cursor-pointer'
          : 'cursor-default'
        }
      `}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-2xl leading-none">{councillor.emoji}</span>
        <StatusBadge status={status} />
      </div>

      <div className="text-sm font-medium text-council-text leading-snug">
        {councillor.name}
      </div>

      {isClickable && (
        <div className="mt-2 text-xs text-council-text-muted group-hover:text-council-text-muted transition-colors">
          Click to view assessment
        </div>
      )}

      {status === 'waiting' && (
        <div className="mt-2 flex items-center gap-1.5">
          <PulseIndicator />
          <span className="text-xs text-council-text-dim">Deliberating</span>
        </div>
      )}

      {status === 'idle' && (
        <div className="mt-2 text-xs text-council-text-dim">Standby</div>
      )}
    </button>
  );
}

function StatusBadge({ status }) {
  if (status === 'idle') return null;

  if (status === 'waiting') {
    return (
      <span className="flex items-center gap-1 text-xs text-council-text-dim px-2 py-0.5 rounded-full border border-council-border">
        <Spinner className="w-2.5 h-2.5" />
        Waiting
      </span>
    );
  }

  if (status === 'ready') {
    return (
      <span className="flex items-center gap-1 text-xs text-council-green px-2 py-0.5 rounded-full border border-council-green/20 bg-council-green/5">
        <span className="w-1.5 h-1.5 rounded-full bg-council-green" />
        Ready
      </span>
    );
  }

  if (status === 'error') {
    return (
      <span className="flex items-center gap-1 text-xs text-council-red px-2 py-0.5 rounded-full border border-council-red/20 bg-council-red/5">
        <span className="w-1.5 h-1.5 rounded-full bg-council-red" />
        Error
      </span>
    );
  }

  return null;
}

function PulseIndicator() {
  return (
    <span className="relative flex h-1.5 w-1.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-council-accent opacity-50" />
      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-council-accent opacity-40" />
    </span>
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
