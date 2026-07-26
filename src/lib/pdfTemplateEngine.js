import QRCode from "qrcode";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Get ORIGINAL vs DUPLICATE status for a document
 */
export function getDocumentCopyTag(docKey) {
  if (!docKey) return "ORIGINAL";
  const storageKey = `doc_dl_count_${String(docKey).trim()}`;
  const currentCount = Number(localStorage.getItem(storageKey) || 0) + 1;
  localStorage.setItem(storageKey, currentCount);
  return currentCount === 1 ? "ORIGINAL" : "DUPLICATE";
}

/**
 * Generate base64 Data URL for a QR Code
 */
export async function generateQRCode(text) {
  try {
    return await QRCode.toDataURL(text || "TRADESTACK", {
      margin: 1,
      width: 180,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });
  } catch (err) {
    console.error("Failed to generate QR code", err);
    return "";
  }
}

/**
 * Generate full HTML template string for Invoice
 */
export async function generateInvoiceHTML({
  title = "Invoice",
  invoiceNumber = "INV-000",
  invoiceDate = new Date().toLocaleString(),
  partyRole = "Customer",
  partyName = "Walk-in Customer",
  partyPhone = "N/A",
  paymentType = "Cash",
  items = [],
  totalAmount = 0,
  discount = 0,
  grandTotal = 0,
  paymentPaid = 0,
  remainingBalance = 0,
  companyName = "TRADESTACK",
  docKey = null,
}) {
  const tagStatus = getDocumentCopyTag(docKey || invoiceNumber);
  const isOriginal = tagStatus === "ORIGINAL";

  const qrString = `INV:${invoiceNumber}|ROLE:${partyRole}|PARTY:${partyName}|TOTAL:${grandTotal}|DATE:${invoiceDate}`;
  const qrCodeUrl = await generateQRCode(qrString);

  const rowsHtml = items
    .map(
      (item, idx) => `
      <tr>
        <td style="text-align: center; padding: 10px 14px; border-bottom: 1px solid #f1f5f9;">${idx + 1}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9;"><strong>${item.product_name || item.name || "Item"}</strong></td>
        <td style="text-align: center; padding: 10px 14px; border-bottom: 1px solid #f1f5f9;">${item.quantity || 1}</td>
        <td style="text-align: right; padding: 10px 14px; border-bottom: 1px solid #f1f5f9;">Rs. ${Number(item.unit_price || 0).toFixed(2)}</td>
        <td style="text-align: right; padding: 10px 14px; border-bottom: 1px solid #f1f5f9;">Rs. ${Number(item.subtotal || 0).toFixed(2)}</td>
      </tr>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} - ${invoiceNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; color: #0f172a; background: #ffffff; padding: 30px; font-size: 13px; min-height: 100vh; display: flex; flex-direction: column; }
    .invoice-card { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px -5px rgba(15,23,42,0.05); flex: 1; display: flex; flex-direction: column; }
    .header-bar { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }
    .brand-container { display: flex; align-items: center; gap: 14px; }
    .brand-logo-badge { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #2563eb 0%, #059669 100%); color: #ffffff; font-weight: 800; font-size: 18px; display: flex; align-items: center; justify-content: center; letter-spacing: 0.5px; box-shadow: 0 6px 16px rgba(37,99,235,0.25); }
    .brand-info h1 { font-size: 20px; font-weight: 800; letter-spacing: 1px; color: #0f172a; text-transform: uppercase; }
    .brand-info p { font-size: 11px; color: #64748b; font-weight: 500; }
    
    .doc-badge { text-align: right; }
    .doc-tag-pill { display: inline-block; padding: 6px 16px; background: ${isOriginal ? "#eff6ff" : "#fff7ed"}; color: ${isOriginal ? "#2563eb" : "#ea580c"}; font-weight: 800; font-size: 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; border: 1px solid ${isOriginal ? "#bfdbfe" : "#ffedd5"}; }
    .doc-number { font-size: 17px; font-weight: 800; color: #1e293b; margin-top: 6px; }
    .doc-date { font-size: 11px; color: #64748b; }
    
    .party-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .party-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; }
    .party-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 6px; }
    .party-name { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
    .party-detail { font-size: 12px; color: #475569; }

    .table-container { margin-bottom: 24px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #0f172a; color: #ffffff; font-weight: 600; font-size: 11px; text-transform: uppercase; padding: 12px 14px; text-align: left; }
    
    .totals-container { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
    .qr-only-box { display: flex; flex-direction: column; align-items: center; background: #ffffff; padding: 6px; border: 1px solid #e2e8f0; border-radius: 10px; }
    .qr-only-box img { width: 100px; height: 100px; display: block; }
    .qr-label { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 2px; }

    .totals-box { width: 300px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; }
    .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px; color: #475569; }
    .totals-row.grand-total { border-top: 2px dashed #cbd5e1; margin-top: 4px; padding-top: 8px; font-size: 14px; font-weight: 800; color: #2563eb; }
    .totals-row.balance { font-weight: 700; color: #ef4444; }

    .signature-area { margin-top: auto; padding-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
    .sign-line { width: 180px; border-top: 1px solid #94a3b8; text-align: center; font-size: 11px; font-weight: 600; color: #475569; padding-top: 6px; }
    .footer-note { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header-bar">
      <div class="brand-container">
        <div class="brand-logo-badge">TS</div>
        <div class="brand-info">
          <h1>${companyName}</h1>
          <p>Paper Trading & Inventory Management</p>
        </div>
      </div>
      <div class="doc-badge">
        <div class="doc-tag-pill">${tagStatus}</div>
        <div class="doc-number">#${invoiceNumber}</div>
        <div class="doc-date">Date: ${invoiceDate}</div>
      </div>
    </div>

    <div class="party-grid">
      <div class="party-card">
        <div class="party-title">Issued By</div>
        <div class="party-name">${companyName}</div>
        <div class="party-detail">Status: Official Trade Record</div>
      </div>
      <div class="party-card">
        <div class="party-title">${partyRole} Information</div>
        <div class="party-name">${partyName}</div>
        <div class="party-detail">Phone: ${partyPhone}</div>
        <div class="party-detail">Type: ${paymentType}</div>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 6%;">#</th>
            <th style="width: 44%;">Product</th>
            <th style="text-align: center; width: 16%;">Qty (Sheets)</th>
            <th style="text-align: right; width: 17%;">Unit Price</th>
            <th style="text-align: right; width: 17%;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>

    <div class="totals-container">
      <div class="qr-only-box">
        <img src="${qrCodeUrl}" alt="QR Code" />
        <span class="qr-label">Scan Code</span>
      </div>
      <div class="totals-box">
        <div class="totals-row">
          <span>Sub Total:</span>
          <span>Rs. ${Number(totalAmount).toFixed(2)}</span>
        </div>
        <div class="totals-row">
          <span>Discount:</span>
          <span>Rs. ${Number(discount).toFixed(2)}</span>
        </div>
        <div class="totals-row grand-total">
          <span>Grand Total:</span>
          <span>Rs. ${Number(grandTotal).toFixed(2)}</span>
        </div>
        <div class="totals-row">
          <span>Payment Paid / Recv:</span>
          <span>Rs. ${Number(paymentPaid).toFixed(2)}</span>
        </div>
        <div class="totals-row balance">
          <span>Remaining Balance:</span>
          <span>Rs. ${Number(remainingBalance).toFixed(2)}</span>
        </div>
      </div>
    </div>

    <div class="signature-area">
      <div class="sign-line">Customer / Receiver</div>
      <div class="sign-line">Authorized Signature</div>
    </div>

    <div class="footer-note">
      Thank you for choosing ${companyName}.
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Open HTML in print window or save as PDF
 */
export async function downloadHTMLDocument(htmlContent, fileName = "Document.pdf") {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to download/print PDF");
    return;
  }
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

/**
 * Enhanced PDF generator using jsPDF + autoTable
 */
export async function generateStyledPDF({
  title,
  subtitle,
  filename,
  metaLeft = [],
  metaRight = [],
  tableHeaders = [],
  tableBody = [],
  summaryRows = [],
  showQRCode = false,
  qrText = "TRADESTACK",
  showSignature = false,
  docKey = null,
}) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Compute ORIGINAL vs DUPLICATE badge tag
  const tagStatus = getDocumentCopyTag(docKey || filename || title);
  const isOriginal = tagStatus === "ORIGINAL";

  // 1. Sidebar Top Logo Badge & Brand Header
  doc.setFillColor(37, 99, 235); // #2563eb
  doc.roundedRect(14, 12, 16, 16, 4, 4, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.text("TS", 22, 22.5, { align: "center" });

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.text("TRADESTACK", 34, 20);

  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(title || "Document", 34, 26);

  if (subtitle) {
    doc.setFontSize(8);
    doc.text(subtitle, 34, 31);
  }

  // Right-aligned Document Tag ("ORIGINAL" vs "DUPLICATE")
  if (isOriginal) {
    doc.setFillColor(239, 246, 255); // Blue tint
    doc.setDrawColor(191, 219, 254);
    doc.setTextColor(37, 99, 235);
  } else {
    doc.setFillColor(255, 247, 237); // Orange tint
    doc.setDrawColor(254, 215, 170);
    doc.setTextColor(234, 88, 12);
  }

  doc.roundedRect(pageWidth - 54, 12, 40, 14, 3, 3, "F");
  doc.roundedRect(pageWidth - 54, 12, 40, 14, 3, 3, "S");
  doc.setFontSize(9);
  doc.setFont(undefined, "bold");
  doc.text(tagStatus, pageWidth - 34, 21, { align: "center" });

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 36, pageWidth - 14, 36);

  // Metadata Left & Right
  let leftY = 44;
  metaLeft.forEach((line) => {
    doc.setFontSize(8.5);
    doc.setFont(undefined, "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(line, 14, leftY);
    leftY += 5.5;
  });

  let rightY = 44;
  metaRight.forEach((line) => {
    doc.setFontSize(8.5);
    doc.setFont(undefined, "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(line, pageWidth - 14, rightY, { align: "right" });
    rightY += 5.5;
  });

  let currentY = Math.max(leftY, rightY) + 4;

  // Table rendering
  if (tableHeaders.length && tableBody.length) {
    autoTable(doc, {
      head: [tableHeaders],
      body: tableBody,
      startY: currentY,
      margin: { left: 14, right: 14 },
      styles: {
        fontSize: 8.5,
        cellPadding: 3,
        textColor: [51, 65, 85],
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    currentY = doc.lastAutoTable.finalY + 8;
  }

  // Summary Rows
  if (summaryRows.length) {
    const boxWidth = 80;
    const boxX = pageWidth - 14 - boxWidth;
    let sY = currentY;

    summaryRows.forEach((s) => {
      doc.setFontSize(8.5);
      if (s.bold) {
        doc.setFont(undefined, "bold");
        doc.setTextColor(37, 99, 235);
      } else {
        doc.setFont(undefined, "normal");
        doc.setTextColor(71, 85, 105);
      }
      doc.text(s.label, boxX, sY);
      doc.text(s.value, pageWidth - 14, sY, { align: "right" });
      sY += 5.5;
    });

    currentY = Math.max(currentY, sY) + 6;
  }

  // Clean QR Code image ONLY (No extra text block next to it)
  if (showQRCode && qrText) {
    const qrDataUrl = await generateQRCode(qrText);
    if (qrDataUrl) {
      const qrY = currentY > 230 ? 230 : currentY;
      doc.addImage(qrDataUrl, "PNG", 14, qrY, 26, 26);
      currentY = qrY + 30;
    }
  }

  // Signature Lines ONLY for Invoices, placed strictly at the bottom of the page
  if (showSignature) {
    const sigY = pageHeight - 25;
    doc.setDrawColor(148, 163, 184);
    doc.line(14, sigY, 64, sigY);
    doc.line(pageWidth - 64, sigY, pageWidth - 14, sigY);

    doc.setFontSize(8);
    doc.setFont(undefined, "normal");
    doc.setTextColor(71, 85, 105);
    doc.text("Received / Customer", 39, sigY + 4, { align: "center" });
    doc.text("Authorized Signature", pageWidth - 39, sigY + 4, { align: "center" });
  }

  doc.save(filename || "TradeStack_Document.pdf");
}
