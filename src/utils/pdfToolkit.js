const BRAND_COLOR = [91, 82, 217];
const ACCENT_COLOR = [16, 185, 129];
const TEXT_COLOR = [30, 41, 59];
const MUTED_COLOR = [100, 116, 139];

export function addPdfBrandHeader(doc, { title, subtitle, metaLeft = [], metaRight = [] }) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, 0, pageWidth, 34, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text("PAPERTECH", 14, 13);
  doc.setFontSize(11);
  doc.setFont(undefined, "normal");
  doc.text(title, 14, 21);

  if (subtitle) {
    doc.setFontSize(8.5);
    doc.text(subtitle, 14, 28);
  }

  doc.setTextColor(...TEXT_COLOR);
  let leftY = 46;
  metaLeft.forEach((line) => {
    doc.setFontSize(9);
    doc.text(line, 14, leftY);
    leftY += 6;
  });

  let rightY = 46;
  const rightX = pageWidth - 14;
  metaRight.forEach((line) => {
    doc.setFontSize(9);
    doc.text(line, rightX, rightY, { align: "right" });
    rightY += 6;
  });

  doc.setDrawColor(...ACCENT_COLOR);
  doc.setLineWidth(0.4);
  doc.line(14, Math.max(leftY, rightY) + 2, pageWidth - 14, Math.max(leftY, rightY) + 2);

  return Math.max(leftY, rightY) + 6;
}

export function addPdfPageFooters(doc, footerText = "PAPERTECH") {
  const pageCount = doc.getNumberOfPages();
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    doc.setPage(pageNumber);
    doc.setTextColor(...MUTED_COLOR);
    doc.setFontSize(8);
    doc.text(`${footerText} - Page ${pageNumber} of ${pageCount}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 8, {
      align: "center",
    });
  }
}
