import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

// Always light — PDFs are documents, not screens
const C = {
  bg:     '#f4f1ec',
  card:   '#e0dbd1',
  border: '#ccc7bc',
  accent: '#8c6d3f',
  text:   '#1a1814',
  muted:  '#5a5550',
  dim:    '#8a8480',
};

const s = StyleSheet.create({
  page:           { backgroundColor: C.bg, paddingHorizontal: 52, paddingVertical: 48, fontFamily: 'Helvetica' },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22, paddingBottom: 14, borderBottomWidth: 0.5, borderBottomColor: C.border },
  brand:          { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.muted, letterSpacing: 2 },
  date:           { fontSize: 9, color: C.dim },
  question:       { fontSize: 17, fontFamily: 'Helvetica-Bold', color: C.text, lineHeight: 1.4, marginBottom: 8 },
  councillors:    { fontSize: 9, color: C.dim, marginBottom: 22, letterSpacing: 0.3 },
  divider:        { borderBottomWidth: 0.5, borderBottomColor: C.border, marginBottom: 16 },
  synthesisLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.accent, letterSpacing: 2, marginBottom: 12 },
  body:           { fontSize: 11, color: C.text, lineHeight: 1.65 },
  h1:             { fontSize: 15, fontFamily: 'Helvetica-Bold', color: C.text, marginTop: 14, marginBottom: 4 },
  h2:             { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.text, marginTop: 12, marginBottom: 4 },
  h3:             { fontSize: 8,  fontFamily: 'Helvetica-Bold', color: C.accent, letterSpacing: 2, marginTop: 14, marginBottom: 4 },
  hr:             { borderBottomWidth: 0.5, borderBottomColor: C.border, marginVertical: 12 },
  listRow:        { flexDirection: 'row', marginBottom: 3 },
  bullet:         { width: 14, fontSize: 11, color: C.text },
  listText:       { flex: 1, fontSize: 11, color: C.text, lineHeight: 1.6 },
  codeBlock:      { backgroundColor: C.card, borderRadius: 3, padding: 10, marginVertical: 8 },
  codeText:       { fontFamily: 'Courier', fontSize: 9, color: C.text },
  spacer:         { height: 6 },
});

// Parse inline markdown into nested <Text> nodes (react-pdf supports nested Text)
function Inline({ children: str }) {
  const parts = [];
  const re = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/gs;
  let last = 0, key = 0, m;
  while ((m = re.exec(str)) !== null) {
    if (m.index > last) parts.push(<Text key={key++}>{str.slice(last, m.index)}</Text>);
    if      (m[2]) parts.push(<Text key={key++} style={{ fontFamily: 'Helvetica-BoldOblique' }}>{m[2]}</Text>);
    else if (m[3]) parts.push(<Text key={key++} style={{ fontFamily: 'Helvetica-Bold' }}>{m[3]}</Text>);
    else if (m[4]) parts.push(<Text key={key++} style={{ fontFamily: 'Helvetica-Oblique' }}>{m[4]}</Text>);
    else if (m[5]) parts.push(<Text key={key++} style={{ fontFamily: 'Courier', fontSize: 9 }}>{m[5]}</Text>);
    last = m.index + m[0].length;
  }
  if (last < str.length) parts.push(<Text key={key++}>{str.slice(last)}</Text>);
  return parts;
}

// Convert markdown string to an array of react-pdf block elements
function mdBlocks(text) {
  const lines = (text || '').split('\n');
  const out = [];
  let i = 0, k = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      const code = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { code.push(lines[i]); i++; }
      out.push(<View key={k++} style={s.codeBlock}><Text style={s.codeText}>{code.join('\n')}</Text></View>);
      i++; continue;
    }

    if (/^---+$/.test(line.trim())) { out.push(<View key={k++} style={s.hr} />); i++; continue; }

    const h3m = line.match(/^###\s+(.+)/);
    if (h3m) { out.push(<Text key={k++} style={s.h3}>{h3m[1].toUpperCase()}</Text>); i++; continue; }

    const h2m = line.match(/^##\s+(.+)/);
    if (h2m) { out.push(<Text key={k++} style={s.h2}><Inline>{h2m[1]}</Inline></Text>); i++; continue; }

    const h1m = line.match(/^#\s+(.+)/);
    if (h1m) { out.push(<Text key={k++} style={s.h1}><Inline>{h1m[1]}</Inline></Text>); i++; continue; }

    if (/^[-*•]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i])) {
        items.push(
          <View key={i} style={s.listRow}>
            <Text style={s.bullet}>•</Text>
            <Text style={s.listText}><Inline>{lines[i].replace(/^[-*•]\s/, '')}</Inline></Text>
          </View>
        );
        i++;
      }
      out.push(<View key={k++}>{items}</View>);
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items = []; let n = 1;
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(
          <View key={i} style={s.listRow}>
            <Text style={s.bullet}>{n++}.</Text>
            <Text style={s.listText}><Inline>{lines[i].replace(/^\d+\.\s/, '')}</Inline></Text>
          </View>
        );
        i++;
      }
      out.push(<View key={k++}>{items}</View>);
      continue;
    }

    if (line.trim() === '') { out.push(<View key={k++} style={s.spacer} />); i++; continue; }

    out.push(<Text key={k++} style={s.body}><Inline>{line}</Inline></Text>);
    i++;
  }
  return out;
}

function SessionDocument({ session }) {
  const displayQuestion = session.condensedQuestion || session.question || '';
  const date = new Date(session.timestamp).toLocaleString([], {
    month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const councillorLine = (session.results ?? [])
    .filter(r => !r.error)
    .map(r => (session.councillorSnapshot ?? []).find(c => c.id === r.id)?.name ?? r.name)
    .join('  ·  ');

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.brand}>THE COUNCIL</Text>
          <Text style={s.date}>{date}</Text>
        </View>

        <Text style={s.question}>{displayQuestion}</Text>
        {councillorLine ? <Text style={s.councillors}>{councillorLine}</Text> : null}

        <View style={s.divider} />
        <Text style={s.synthesisLabel}>CHAIRPERSON'S SYNTHESIS</Text>

        {mdBlocks(session.chairpersonContent)}
      </Page>
    </Document>
  );
}

export async function exportSessionPDF(session) {
  const blob = await pdf(<SessionDocument session={session} />).toBlob();
  const slug = (session.condensedQuestion || session.question || 'session')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: `council-${slug}.pdf` });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
