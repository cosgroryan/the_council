// Lightweight markdown renderer — handles bold, italic, inline code,
// headers, bullet lists, numbered lists, horizontal rules, and code blocks.
export default function Markdown({ text, className = '' }) {
  if (!text) return null;
  return (
    <div className={`markdown ${className}`}>
      {renderBlocks(text)}
    </div>
  );
}

function renderBlocks(text) {
  const lines = text.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push(
        <pre key={i} className="bg-council-surface border border-council-border rounded px-4 py-3 text-xs text-council-text-muted overflow-x-auto my-3 font-mono">
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={i} className="border-council-border my-4" />);
      i++;
      continue;
    }

    // Heading
    const hMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (hMatch) {
      const level = hMatch[1].length;
      const cls = level === 1
        ? 'text-base font-semibold text-council-text mt-4 mb-1'
        : level === 2
          ? 'text-sm font-semibold text-council-text mt-3 mb-1'
          : 'text-xs font-semibold text-council-accent uppercase tracking-widest mt-3 mb-1';
      blocks.push(<div key={i} className={cls}>{renderInline(hMatch[2])}</div>);
      i++;
      continue;
    }

    // Bullet list — collect consecutive bullet lines
    if (/^[-*•]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i])) {
        items.push(<li key={i} className="text-sm text-council-text leading-relaxed">{renderInline(lines[i].replace(/^[-*•]\s/, ''))}</li>);
        i++;
      }
      blocks.push(<ul key={`ul-${i}`} className="list-disc list-inside space-y-0.5 my-2 pl-1">{items}</ul>);
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(<li key={i} className="text-sm text-council-text leading-relaxed">{renderInline(lines[i].replace(/^\d+\.\s/, ''))}</li>);
        i++;
      }
      blocks.push(<ol key={`ol-${i}`} className="list-decimal list-inside space-y-0.5 my-2 pl-1">{items}</ol>);
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      blocks.push(<div key={i} className="h-2" />);
      i++;
      continue;
    }

    // Paragraph
    blocks.push(
      <p key={i} className="text-sm text-council-text leading-relaxed">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return blocks;
}

function renderInline(text) {
  // Split on bold, italic, inline code patterns
  const parts = [];
  const re = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0;
  let m;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));

    if (m[2]) parts.push(<strong key={m.index}><em>{m[2]}</em></strong>);
    else if (m[3]) parts.push(<strong key={m.index} className="font-semibold text-council-text">{m[3]}</strong>);
    else if (m[4]) parts.push(<em key={m.index} className="italic">{m[4]}</em>);
    else if (m[5]) parts.push(<code key={m.index} className="bg-council-surface border border-council-border rounded px-1 py-0.5 text-xs font-mono text-council-accent">{m[5]}</code>);

    last = m.index + m[0].length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
}
