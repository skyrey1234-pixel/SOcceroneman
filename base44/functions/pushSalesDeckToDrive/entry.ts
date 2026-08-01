import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { jsPDF } from 'npm:jspdf@4.0.0';

function buildPdf({ slides = [], pricing = [], features = [], includeNotes = true }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const width = pageW - margin * 2;
  let y = margin;

  const space = (h) => {
    if (y + h > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const text = (str, { size = 11, style = 'normal', gap = 6, indent = 0 } = {}) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(String(str), width - indent);
    for (const line of lines) {
      space(size + 4);
      doc.text(line, margin + indent, y);
      y += size + 4;
    }
    y += gap;
  };

  slides.forEach((slide, i) => {
    if (i > 0) {
      doc.addPage();
      y = margin;
    }
    text(`${i + 1} / ${slides.length}  ·  ${slide.eyebrow || ''}`.toUpperCase(), { size: 9, gap: 4 });
    text(slide.title || '', { size: 20, style: 'bold', gap: 10 });
    if (slide.body) text(slide.body, { size: 12 });
    (slide.bullets || []).forEach((b) => text(`•  ${b}`, { indent: 10, gap: 2 }));
    (slide.steps || []).forEach((s) => text(`${s.t}  —  ${s.d}`, { indent: 10, gap: 2 }));
    (slide.items || []).forEach((it) => {
      text(it.o, { style: 'bold', gap: 2, indent: 10 });
      text(it.a, { indent: 10 });
    });

    if (slide.kind === 'features') {
      features.forEach((f) => {
        text(`${f.name} — ${f.pitch}`, { style: 'bold', gap: 2 });
        text(f.detail, { size: 10, gap: 2 });
        if (f.example) text(f.example, { size: 10, style: 'italic', indent: 10 });
      });
    }

    if (slide.kind === 'pricing') {
      pricing.forEach((p) => {
        text(`${p.tier} — $${p.monthly}/mo or $${p.season}/season (${p.seasonNote || ''})`, {
          style: 'bold',
          gap: 2,
        });
        text(p.who, { size: 10, gap: 2 });
        (p.includes || []).forEach((inc) => text(`•  ${inc}`, { size: 10, indent: 10, gap: 1 }));
        y += 6;
      });
    }

    if (includeNotes && slide.notes) {
      y += 6;
      text('PRESENTER NOTES', { size: 9, style: 'bold', gap: 3 });
      text(slide.notes, { size: 10, style: 'italic' });
    }
  });

  return new Uint8Array(doc.output('arraybuffer'));
}

function toBase64(bytes) {
  let binary = '';
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const pdfBytes = buildPdf(body);
    const fileName = body.fileName || `Coach Pitch Deck — ${new Date().toISOString().slice(0, 10)}.pdf`;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    const boundary = 'b44deck' + Math.random().toString(36).slice(2);
    const multipart =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify({ name: fileName, mimeType: 'application/pdf' }) +
      `\r\n--${boundary}\r\nContent-Type: application/pdf\r\nContent-Transfer-Encoding: base64\r\n\r\n` +
      toBase64(pdfBytes) +
      `\r\n--${boundary}--`;

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipart,
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return Response.json({ error: data?.error?.message || 'Google Drive upload failed' }, { status: 502 });
    }

    return Response.json({ id: data.id, name: data.name, webViewLink: data.webViewLink });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}