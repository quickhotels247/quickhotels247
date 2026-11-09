import { StreamableFile } from "@nestjs/common";

// A PDF download: inline so phones open it, with a sensible file name.
export const pdfFile = (content: Buffer, filename: string) =>
  new StreamableFile(content, { type: "application/pdf", disposition: `inline; filename="${filename.replace(/[^\w.\-]/g, "_")}"`, length: content.length });
