import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Complaint } from '../types';

/**
 * Generates an A4 acknowledgement slip for a complaint using pdf-lib.
 * Uses the built-in Helvetica font (Latin script); content is generated in English.
 */
export async function generateComplaintReceiptPdf(complaint: Complaint): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const mono = await doc.embedFont(StandardFonts.Courier);

  const W = page.getWidth();
  let y = page.getHeight() - 48;
  const margin = 48;
  const left = margin;
  const emerald = rgb(0.05, 0.35, 0.28);
  const dark = rgb(0.08, 0.09, 0.1);
  const grey = rgb(0.42, 0.45, 0.5);

  const line = (text: string, size = 11, opts: { bold?: boolean; color?: typeof dark; gap?: number } = {}) => {
    page.drawText(text, {
      x: left,
      y,
      size,
      font: opts.bold ? font : regular,
      color: opts.color || dark,
    });
    y -= opts.gap ?? size + 6;
  };

  page.drawRectangle({ x: 0, y: y - 14, width: W, height: 4, color: emerald });

  line('GOVERNMENT OF BIHAR - PANCHAYATI RAJ DEPARTMENT', 14, { bold: true, color: emerald });
  line('GramSetu Complaint Portal', 10, { color: grey });
  line('GramSetu Official Acknowledgement Slip', 10, { color: grey, gap: 24 });

  line('OFFICIAL COMPLAINT TRACKING ID', 9, { bold: true, color: grey, gap: 3 });
  line(complaint.id, 22, { bold: true, color: emerald, gap: 20 });

  line('Citizen', 9, { bold: true, color: grey, gap: 3 });
  line(
    `${complaint.submittedBy.name}  |  Mob: ${complaint.submittedBy.mobile || '—'}  |  ${complaint.submittedBy.email || '—'}`,
    10,
    { gap: 18 }
  );

  line('Location', 9, { bold: true, color: grey, gap: 3 });
  line(
    `${complaint.location.village}, ${complaint.location.ward} | ${complaint.location.panchayat}, ${complaint.location.district}`,
    10,
    { gap: 18 }
  );

  line('Problem Category', 9, { bold: true, color: grey, gap: 3 });
  line(complaint.category.replace(/_/g, ' ').toUpperCase(), 10, { gap: 18 });

  line('Complaint Subject', 9, { bold: true, color: grey, gap: 3 });
  line(complaint.title, 10, { gap: 18 });

  line('Submitted', 9, { bold: true, color: grey, gap: 3 });
  line(complaint.createdAt, 10, { gap: 18 });

  line('Statutory Due Date (7-Day SLA)', 9, { bold: true, color: grey, gap: 3 });
  line(complaint.dueDate, 10, { color: emerald, gap: 18 });

  line('Assigned Authority', 9, { bold: true, color: grey, gap: 3 });
  line(complaint.currentAuthority, 10, { gap: 22 });

  page.drawText('Note: If no action is initiated within 7 statutory working days, the case automatically', {
    x: left,
    y,
    size: 8,
    font: regular,
    color: grey,
  });
  y -= 12;
  page.drawText('escalates to the next administrative tier. Keep this ID safe for web tracking.', {
    x: left,
    y,
    size: 8,
    font: regular,
    color: grey,
  });
  y -= 26;

  page.drawText(`Scan / visit: track with complaint ID ${complaint.id}`, {
    x: left,
    y,
    size: 8,
    font: mono,
    color: emerald,
  });

  y -= 40;
  page.drawText('Emergency Helpline: 9142946979    |    Support: suman914294@gmail.com', {
    x: left,
    y,
    size: 8,
    font: regular,
    color: grey,
  });

  return doc.save();
}