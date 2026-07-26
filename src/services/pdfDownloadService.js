import api from './apiClient';

/**
 * Download invoice PDF from backend
 * @param {string} invoiceType - 'sale' or 'purchase'
 * @param {number} invoiceId - ID of the invoice
 * @param {string} fileName - Optional filename for the downloaded file
 */
export const downloadInvoicePDF = async (invoiceType, invoiceId, fileName) => {
  try {
    const response = await api.get(
      `/pdf/invoice/${invoiceType}/${invoiceId}/download`,
      {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf',
        },
      }
    );

    // Create blob and trigger download
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || `Invoice_${invoiceId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, message: 'PDF downloaded successfully' };
  } catch (error) {
    console.error('PDF Download Error:', error);
    throw error;
  }
};

/**
 * Preview invoice (open in new tab)
 * @param {string} invoiceType - 'sale' or 'purchase'
 * @param {number} invoiceId - ID of the invoice
 */
export const previewInvoice = (invoiceType, invoiceId) => {
  try {
    const url = `${api.defaults.baseURL}/pdf/invoice/${invoiceType}/${invoiceId}`;
    window.open(url, '_blank');
  } catch (error) {
    console.error('Preview Error:', error);
    throw error;
  }
};
