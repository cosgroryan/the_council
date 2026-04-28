import { useState } from 'react';

const EMOJI_OPTIONS = ['📊', '⚙️', '🔍', '🌱', '🧱', '🧠', '📜', '🔄', '🔭', '🔥', '⚖️', '🎯', '💡', '🌊', '🧩'];

export default function CouncillorEditor({ councillors, onAdd, onUpdate, onRemove, onReset }) {
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [flashNew, setFlashNew] = useState(null);

  const activeCount = councillors.filter(c => c.active !== false).length;

  function handleAdd(data) {
    const id = `custom-${Date.now()}`;
    onAdd({ ...data, id, active: true });
    setFlashNew(id);
    setShowAddForm(false);
    setTimeout(() => setFlashNew(null), 3000);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-council-text">Personas</h2>
          <p className="text-sm text-council-text-muted mt-1">
            Configure the archetypes governing the Council's logic.{' '}
            <span className="text-council-text-dim">{activeCount} of {councillors.length} active.</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onReset}
            className="text-xs px-3 py-1.5 rounded border border-council-border text-council-text-muted hover:border-council-border-light hover:text-council-text transition-colors"
          >
            Reset to defaults
          </button>
          <button
            onClick={() => { setShowAddForm(true); setEditingId(null); }}
            className="text-xs px-3 py-1.5 rounded bg-council-accent text-council-bg font-semibold hover:bg-council-accent-light transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add new councillor
          </button>
        </div>
      </div>

      {/* Councillor grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {councillors.map(councillor => (
          <CouncillorEditCard
            key={councillor.id}
            councillor={councillor}
            isEditing={editingId === councillor.id}
            isNew={flashNew === councillor.id}
            canDelete={councillors.length > 1}
            onToggle={() => onUpdate(councillor.id, { active: councillor.active === false ? true : false })}
            onEdit={() => setEditingId(editingId === councillor.id ? null : councillor.id)}
            onSave={(updates) => { onUpdate(councillor.id, updates); setEditingId(null); }}
            onCancel={() => setEditingId(null)}
            onRemove={() => onRemove(councillor.id)}
          />
        ))}

        {showAddForm && (
          <NewCouncillorForm
            onSave={handleAdd}
            onCancel={() => setShowAddForm(false)}
          />
        )}
      </div>
    </div>
  );
}

function CouncillorEditCard({ councillor, isEditing, isNew, canDelete, onToggle, onEdit, onSave, onCancel, onRemove }) {
  const [draft, setDraft] = useState({ name: councillor.name, emoji: councillor.emoji, systemPrompt: councillor.systemPrompt });
  const isActive = councillor.active !== false;

  function handleSave() {
    if (!draft.name.trim() || !draft.systemPrompt.trim()) return;
    onSave(draft);
  }

  function handleEdit() {
    setDraft({ name: councillor.name, emoji: councillor.emoji, systemPrompt: councillor.systemPrompt });
    onEdit();
  }

  return (
    <div className={`bg-council-card border rounded-lg overflow-hidden transition-all duration-200 ${
      isNew ? 'border-council-accent/50' : 'border-council-border'
    } ${!isActive ? 'opacity-50' : ''}`}>
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-council-border">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`text-xl flex-shrink-0 transition-all ${!isActive ? 'grayscale' : ''}`}>
            {councillor.emoji}
          </span>
          <span className="text-sm font-medium text-council-text truncate">{councillor.name}</span>
          {isNew && (
            <span className="text-xs text-council-accent border border-council-accent/30 px-2 py-0.5 rounded flex-shrink-0">
              New
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {/* Active toggle */}
          <button
            onClick={onToggle}
            title={isActive ? 'Deactivate' : 'Activate'}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isActive ? 'bg-council-accent' : 'bg-council-border-light'
            }`}
          >
            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
              isActive ? 'translate-x-4' : 'translate-x-0'
            }`} />
          </button>

          {/* Edit */}
          <button
            onClick={handleEdit}
            className="p-1.5 text-council-text-dim hover:text-council-text transition-colors rounded"
            title={isEditing ? 'Close' : 'Edit'}
          >
            {isEditing ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            )}
          </button>

          {/* Delete */}
          {canDelete && (
            <button
              onClick={onRemove}
              className="p-1.5 text-council-text-dim hover:text-council-red transition-colors rounded"
              title="Remove"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Edit form */}
      {isEditing && (
        <div className="px-4 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-council-text-dim uppercase tracking-widest mb-1.5">Name</label>
              <input
                type="text"
                value={draft.name}
                onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                className="w-full bg-council-surface border border-council-border rounded px-3 py-1.5 text-sm text-council-text focus:outline-none focus:border-council-border-light transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-council-text-dim uppercase tracking-widest mb-1.5">Emoji</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={draft.emoji}
                  onChange={e => setDraft(d => ({ ...d, emoji: e.target.value }))}
                  className="w-16 bg-council-surface border border-council-border rounded px-3 py-1.5 text-sm text-council-text focus:outline-none focus:border-council-border-light transition-colors text-center"
                  maxLength={4}
                />
                <div className="flex flex-wrap gap-1 overflow-hidden max-h-8">
                  {EMOJI_OPTIONS.slice(0, 6).map(e => (
                    <button
                      key={e}
                      onClick={() => setDraft(d => ({ ...d, emoji: e }))}
                      className={`text-sm w-7 h-7 rounded flex items-center justify-center transition-colors ${
                        draft.emoji === e ? 'bg-council-accent/20 border border-council-accent/40' : 'hover:bg-council-border'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-council-text-dim uppercase tracking-widest mb-1.5">System Prompt</label>
            <textarea
              value={draft.systemPrompt}
              onChange={e => setDraft(d => ({ ...d, systemPrompt: e.target.value }))}
              rows={6}
              className="w-full bg-council-surface border border-council-border rounded px-3 py-2 text-xs text-council-text focus:outline-none focus:border-council-border-light transition-colors resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center gap-2 justify-end pt-1">
            <button
              onClick={onCancel}
              className="text-xs px-3 py-1.5 text-council-text-muted hover:text-council-text transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!draft.name.trim() || !draft.systemPrompt.trim()}
              className="text-xs px-4 py-1.5 bg-council-accent text-council-bg font-semibold rounded hover:bg-council-accent-light transition-colors disabled:opacity-40"
            >
              Save changes
            </button>
          </div>
        </div>
      )}

      {/* Prompt preview (non-editing) */}
      {!isEditing && (
        <div className="px-4 py-3">
          <p className="text-xs text-council-text-dim leading-relaxed line-clamp-3">
            {councillor.systemPrompt}
          </p>
        </div>
      )}
    </div>
  );
}

function NewCouncillorForm({ onSave, onCancel }) {
  const [data, setData] = useState({ name: '', emoji: '💡', systemPrompt: '' });

  function handleSave() {
    if (!data.name.trim() || !data.systemPrompt.trim()) return;
    onSave(data);
  }

  return (
    <div className="bg-council-card border border-council-accent/40 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-council-border">
        <span className="text-sm font-medium text-council-text">New Councillor</span>
        <button onClick={onCancel} className="p-1.5 text-council-text-dim hover:text-council-text transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-4 py-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-council-text-dim uppercase tracking-widest mb-1.5">Name</label>
            <input
              type="text"
              value={data.name}
              onChange={e => setData(d => ({ ...d, name: e.target.value }))}
              placeholder="The Strategist"
              autoFocus
              className="w-full bg-council-surface border border-council-border rounded px-3 py-1.5 text-sm text-council-text placeholder:text-council-text-dim focus:outline-none focus:border-council-border-light transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-council-text-dim uppercase tracking-widest mb-1.5">Emoji</label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={data.emoji}
                onChange={e => setData(d => ({ ...d, emoji: e.target.value }))}
                className="w-16 bg-council-surface border border-council-border rounded px-3 py-1.5 text-sm text-council-text focus:outline-none focus:border-council-border-light transition-colors text-center"
                maxLength={4}
              />
              <div className="flex flex-wrap gap-1 overflow-hidden max-h-8">
                {EMOJI_OPTIONS.slice(0, 6).map(e => (
                  <button
                    key={e}
                    onClick={() => setData(d => ({ ...d, emoji: e }))}
                    className={`text-sm w-7 h-7 rounded flex items-center justify-center transition-colors ${
                      data.emoji === e ? 'bg-council-accent/20 border border-council-accent/40' : 'hover:bg-council-border'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs text-council-text-dim uppercase tracking-widest mb-1.5">System Prompt</label>
          <textarea
            value={data.systemPrompt}
            onChange={e => setData(d => ({ ...d, systemPrompt: e.target.value }))}
            rows={6}
            placeholder="You are [name] on a decision-making council. Your job is to..."
            className="w-full bg-council-surface border border-council-border rounded px-3 py-2 text-xs text-council-text placeholder:text-council-text-dim focus:outline-none focus:border-council-border-light transition-colors resize-none leading-relaxed"
          />
        </div>

        <div className="flex items-center gap-2 justify-end pt-1">
          <button onClick={onCancel} className="text-xs px-3 py-1.5 text-council-text-muted hover:text-council-text transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!data.name.trim() || !data.systemPrompt.trim()}
            className="text-xs px-4 py-1.5 bg-council-accent text-council-bg font-semibold rounded hover:bg-council-accent-light transition-colors disabled:opacity-40"
          >
            Install councillor
          </button>
        </div>
      </div>
    </div>
  );
}
