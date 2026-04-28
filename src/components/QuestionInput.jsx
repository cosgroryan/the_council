import { useState, useRef, useCallback } from 'react';
import { parseFile } from '../utils/fileParser';

const ACCEPTED_TYPES = '.pdf,.docx,.xlsx,.xls,.csv,.txt,.md,.json';
const FILE_ICONS = { pdf: '📄', docx: '📝', xlsx: '📊', xls: '📊', csv: '📊', txt: '📃', md: '📃', json: '📋' };

export default function QuestionInput({ onSubmit, isLoading }) {
  const [value, setValue] = useState('');
  const [files, setFiles] = useState([]); // {id, name, type, status, content, descriptor, error}
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const addFiles = useCallback(async (rawFiles) => {
    const incoming = Array.from(rawFiles).map(f => ({
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      name: f.name,
      type: f.name.split('.').pop().toLowerCase(),
      status: 'parsing',
      content: '',
      descriptor: '',
      error: null,
    }));

    setFiles(prev => [...prev, ...incoming]);

    await Promise.all(
      Array.from(rawFiles).map(async (rawFile, i) => {
        const id = incoming[i].id;
        const result = await parseFile(rawFile);
        setFiles(prev => prev.map(f =>
          f.id === id
            ? { ...f, status: result.error ? 'error' : 'ready', content: result.content, descriptor: result.descriptor, error: result.error ?? null }
            : f
        ));
      })
    );
  }, []);

  function handleFileInput(e) {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = '';
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }

  function removeFile(id) {
    setFiles(prev => prev.filter(f => f.id !== id));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim() || isLoading) return;
    const readyFiles = files.filter(f => f.status === 'ready');
    onSubmit(value.trim(), readyFiles);
    setValue('');
    setFiles([]);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e);
  }

  const hasParsingFiles = files.some(f => f.status === 'parsing');

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block text-xs font-medium text-council-text-muted uppercase tracking-widest">
        Put your question or decision to The Council
      </label>

      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        placeholder="Describe the decision, situation, or question you want the council to analyse..."
        rows={5}
        className="w-full bg-council-surface border border-council-border rounded-lg px-4 py-3 text-sm text-council-text placeholder:text-council-text-dim resize-none focus:outline-none focus:border-council-border-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed"
      />

      {/* File drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-dashed cursor-pointer transition-colors text-xs select-none ${
          isDragging
            ? 'border-council-accent/60 bg-council-accent/5 text-council-accent'
            : 'border-council-border text-council-text-dim hover:border-council-border-light hover:text-council-text-muted'
        }`}
      >
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
        </svg>
        <span>{isDragging ? 'Drop to attach' : 'Attach files — PDF, DOCX, Excel, CSV, TXT, MD, JSON'}</span>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* File chips */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map(f => (
            <FileChip key={f.id} file={f} onRemove={removeFile} />
          ))}
        </div>
      )}

      {/* Footer row */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-council-text-dim">
          {isLoading
            ? 'Council is deliberating...'
            : hasParsingFiles
              ? 'Parsing files...'
              : 'Press ⌘+Enter or click to convene'}
        </span>
        <button
          type="submit"
          disabled={isLoading || !value.trim() || hasParsingFiles}
          className="px-6 py-2.5 bg-council-accent text-council-bg text-sm font-semibold rounded-lg hover:bg-council-accent-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Spinner className="w-3.5 h-3.5" />
              Deliberating
            </span>
          ) : (
            'Convene the Council'
          )}
        </button>
      </div>
    </form>
  );
}

function FileChip({ file, onRemove }) {
  const icon = FILE_ICONS[file.type] ?? '📎';

  return (
    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
      file.status === 'error'
        ? 'border-council-red/30 bg-council-red/5 text-council-red/80'
        : file.status === 'parsing'
          ? 'border-council-border bg-council-surface text-council-text-muted'
          : 'border-council-border bg-council-surface text-council-text-muted'
    }`}>
      <span className="text-sm leading-none">{icon}</span>
      <span className="max-w-[160px] truncate">{file.name}</span>
      {file.status === 'parsing' && <Spinner className="w-3 h-3 flex-shrink-0" />}
      {file.status === 'ready' && (
        <span className="w-1.5 h-1.5 rounded-full bg-council-green flex-shrink-0" />
      )}
      {file.status === 'error' && (
        <span title={file.error} className="w-1.5 h-1.5 rounded-full bg-council-red flex-shrink-0" />
      )}
      <button
        type="button"
        onClick={() => onRemove(file.id)}
        className="text-council-text-dim hover:text-council-text transition-colors ml-0.5 flex-shrink-0"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
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
