const MAX_CHARS = 40000; // ~10k tokens, safe headroom for 5 councillors + chairperson

let _pdfjs = null;
async function getPdfjs() {
  if (!_pdfjs) {
    _pdfjs = await import('pdfjs-dist');
    _pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).href;
  }
  return _pdfjs;
}

export async function parseFile(file) {
  const name = file.name;
  const ext = name.split('.').pop().toLowerCase();
  try {
    if (ext === 'pdf') return await parsePDF(file);
    if (ext === 'docx' || ext === 'doc') return await parseWord(file);
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') return await parseExcel(file, ext);
    throw new Error(`Unsupported type: .${ext}`);
  } catch (err) {
    return { name, type: ext, content: '', descriptor: `${name} — failed to parse`, error: err.message };
  }
}

async function parsePDF(file) {
  const pdfjs = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

  const pageTexts = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    pageTexts.push(tc.items.map(it => it.str).join(' '));
  }

  const raw = pageTexts.join('\n');
  const wordCount = raw.trim().split(/\s+/).filter(Boolean).length;
  const truncated = raw.length > MAX_CHARS;
  const content = truncated ? raw.slice(0, MAX_CHARS) + '\n[... content truncated ...]' : raw;

  return {
    name: file.name,
    type: 'pdf',
    content,
    descriptor: `${file.name} — PDF, ${pdf.numPages} page${pdf.numPages !== 1 ? 's' : ''}, ~${wordCount.toLocaleString()} words${truncated ? ' (truncated)' : ''}`,
    truncated,
  };
}

async function parseWord(file) {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.default.extractRawText({ arrayBuffer });

  const raw = result.value;
  const wordCount = raw.trim().split(/\s+/).filter(Boolean).length;
  const truncated = raw.length > MAX_CHARS;
  const content = truncated ? raw.slice(0, MAX_CHARS) + '\n[... content truncated ...]' : raw;

  return {
    name: file.name,
    type: 'docx',
    content,
    descriptor: `${file.name} — Word document, ~${wordCount.toLocaleString()} words${truncated ? ' (truncated)' : ''}`,
    truncated,
  };
}

async function parseExcel(file, ext) {
  const XLSX = await import('xlsx');
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const sheetNames = workbook.SheetNames;
  let raw = '';
  let totalRows = 0;

  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    totalRows += rows.length;
    const sheetText = rows.map(row => row.join('\t')).join('\n');
    raw += `[Sheet: ${sheetName}]\n${sheetText}\n\n`;
  }

  const truncated = raw.length > MAX_CHARS;
  const content = truncated ? raw.slice(0, MAX_CHARS) + '\n[... content truncated ...]' : raw;

  const typeLabel = ext === 'csv' ? 'CSV' : 'Excel workbook';
  const sheetLabel = sheetNames.length === 1 ? sheetNames[0] : `${sheetNames.length} sheets: ${sheetNames.join(', ')}`;

  return {
    name: file.name,
    type: ext,
    content,
    descriptor: `${file.name} — ${typeLabel}, ${sheetLabel}, ~${totalRows.toLocaleString()} rows${truncated ? ' (truncated)' : ''}`,
    truncated,
  };
}
