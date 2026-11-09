import PDFDocument from "pdfkit";

// Shared look for our PDFs (vouchers, e-tickets): A4, the brand band, and
// helpers for headings, label/value rows and notes. The built-in Helvetica
// has no ₹ or arrows, so text goes through `plain` first.

export const BRAND = "#0b5cff";
const INK = "#111827";
const MUTED = "#6b7280";
const LINE = "#e5e7eb";
export const SUPPORT_EMAIL = "quickhotels247@gmail.com";

// Helvetica covers Latin-1 (WinAnsi): swap what it can't draw.
export const plain = (value: string) =>
  value
    .replace(/₹\s?/g, "Rs. ")
    .replace(/[→⇄]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x09\x0a\x0d\x20-\x7e\xa0-\xff–—•·…]/g, "?");

export const rupees = (money: { amount: number; currency: string }) =>
  `${money.currency === "INR" ? "Rs." : money.currency} ${money.amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const longDate = (isoDay: string) =>
  new Date(`${isoDay.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export class PdfWriter {
  readonly doc: PDFKit.PDFDocument;
  private readonly left = 48;
  private readonly width: number;

  constructor(title: string, subject: string) {
    this.doc = new PDFDocument({ size: "A4", margins: { top: 0, bottom: 48, left: 48, right: 48 }, info: { Title: plain(title), Author: "QuickHotels24/7", Subject: plain(subject) } });
    this.width = this.doc.page.width - 96;
  }

  // The coloured band at the top: brand on the left, document name on the right.
  header(kind: string) {
    const { doc } = this;
    doc.rect(0, 0, doc.page.width, 72).fill(BRAND);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(20).text("QuickHotels24/7", this.left, 26, { lineBreak: false });
    doc.font("Helvetica").fontSize(12).text(plain(kind), this.left, 31, { width: this.width, align: "right" });
    doc.y = 96;
    doc.fillColor(INK);
  }

  // A large reference with a caption, and a status pill.
  headline(caption: string, value: string, status?: string) {
    const { doc } = this;
    doc.font("Helvetica").fontSize(10).fillColor(MUTED).text(plain(caption).toUpperCase(), this.left, doc.y, { characterSpacing: 0.5 });
    const top = doc.y + 2;
    doc.font("Helvetica-Bold").fontSize(22).fillColor(INK).text(plain(value), this.left, top);
    if (status) {
      const w = doc.font("Helvetica-Bold").fontSize(10).widthOfString(status) + 20;
      doc.roundedRect(this.left + this.width - w, top + 2, w, 20, 10).fill("#dcfce7");
      doc.fillColor("#166534").text(status, this.left + this.width - w, top + 7, { width: w, align: "center" });
    }
    doc.fillColor(INK);
    doc.y = top + 34;
  }

  section(title: string) {
    const { doc } = this;
    this.room(60);
    doc.moveDown(0.6);
    const y = doc.y;
    doc.moveTo(this.left, y).lineTo(this.left + this.width, y).strokeColor(LINE).lineWidth(1).stroke();
    doc.y = y + 10;
    doc.font("Helvetica-Bold").fontSize(12).fillColor(BRAND).text(plain(title), this.left, doc.y);
    doc.moveDown(0.3);
    doc.fillColor(INK);
  }

  // Label on the left, value on the right, wrapping as needed.
  row(label: string, value: string, bold = false) {
    const { doc } = this;
    this.room(18);
    const y = doc.y;
    doc.font("Helvetica").fontSize(10).fillColor(MUTED).text(plain(label), this.left, y, { width: 150 });
    const afterLabel = doc.y;
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(10).fillColor(INK).text(plain(value), this.left + 160, y, { width: this.width - 160 });
    doc.y = Math.max(afterLabel, doc.y) + 3;
  }

  text(value: string, options: { bold?: boolean; size?: number; muted?: boolean } = {}) {
    const { doc } = this;
    this.room(16);
    doc.font(options.bold ? "Helvetica-Bold" : "Helvetica").fontSize(options.size ?? 10).fillColor(options.muted ? MUTED : INK).text(plain(value), this.left, doc.y, { width: this.width });
    doc.moveDown(0.2);
  }

  bullets(items: string[]) {
    for (const item of items) this.text(`•  ${item}`, { muted: true, size: 9 });
  }

  // A simple table with header row; column widths as fractions of the page.
  table(columns: { title: string; share: number }[], rows: string[][]) {
    const { doc } = this;
    const widths = columns.map((column) => column.share * this.width);
    const draw = (cells: string[], header: boolean) => {
      this.room(20);
      const y = doc.y;
      let x = this.left;
      let bottom = y;
      cells.forEach((cell, i) => {
        doc.font(header ? "Helvetica-Bold" : "Helvetica").fontSize(9).fillColor(header ? MUTED : INK).text(plain(cell), x + 4, y + 4, { width: widths[i]! - 8 });
        bottom = Math.max(bottom, doc.y);
        x += widths[i]!;
      });
      if (header) doc.rect(this.left, y, this.width, bottom - y + 4).fillOpacity(0.06).fill(BRAND).fillOpacity(1);
      doc.moveTo(this.left, bottom + 4).lineTo(this.left + this.width, bottom + 4).strokeColor(LINE).lineWidth(0.5).stroke();
      doc.y = bottom + 6;
    };
    draw(columns.map((column) => column.title), true);
    rows.forEach((row) => draw(row, false));
    doc.moveDown(0.3);
  }

  footer(note: string) {
    const { doc } = this;
    this.room(40);
    doc.moveDown(1);
    doc.font("Helvetica").fontSize(8).fillColor(MUTED).text(plain(note), this.left, doc.y, { width: this.width, align: "center" });
  }

  // A new page when less than `space` points are left.
  private room(space: number) {
    const { doc } = this;
    if (doc.y + space > doc.page.height - 48) {
      doc.addPage({ margins: { top: 48, bottom: 48, left: 48, right: 48 } });
      doc.y = 48;
    }
  }

  async toBuffer(): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      this.doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      this.doc.on("end", () => resolve(Buffer.concat(chunks)));
      this.doc.on("error", reject);
      this.doc.end();
    });
  }
}
