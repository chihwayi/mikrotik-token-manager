import pool from '../config/database.js';
import TokenTransaction from '../models/TokenTransaction.js';

class PDFService {
  /**
   * Generate PDF with tokens arranged in a grid
   * @param {Array} tokenIds - Array of token transaction IDs
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generateTokenMatrixPDF(tokenIds) {
    // Dynamic import of pdfkit and qrcode to avoid blocking server startup
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    const PDFDocument = require('pdfkit');
    const QRCode = require('qrcode');
    // Fetch tokens with package and router info
    const tokens = await Promise.all(
      tokenIds.map(id => TokenTransaction.findById(id))
    );

    // Filter out null tokens
    const validTokens = tokens.filter(t => t !== null);

    if (validTokens.length === 0) {
      throw new Error('No valid tokens found');
    }

    // Fetch package details for tokens
    const packageIds = [...new Set(validTokens.map(t => t.package_id))];
    const packageMap = new Map();
    
    for (const packageId of packageIds) {
      const result = await pool.query(
        'SELECT id, name, duration_hours, data_limit_mb, price FROM token_packages WHERE id = $1',
        [packageId]
      );
      if (result.rows.length > 0) {
        packageMap.set(packageId, result.rows[0]);
      }
    }

    // Pre-generate all QR codes for tokens BEFORE creating PDF
    const qrCodeMap = new Map();
    for (const token of validTokens) {
      try {
        const qrBuffer = await QRCode.toBuffer(token.voucher_code, {
          width: 128, // Higher resolution (32pt * 4)
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        qrCodeMap.set(token.id, qrBuffer);
      } catch (qrError) {
        console.warn(`QR code generation failed for token ${token.voucher_code}:`, qrError.message);
        // Continue without QR code for this token
      }
    }

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 30, bottom: 30, left: 20, right: 20 }
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // PDF Layout Constants - Optimized for 5 columns on A4
        const pageWidth = 595; // A4 width in points (210mm)
        const pageHeight = 842; // A4 height in points (297mm)
        const margin = 20; // Margin for better spacing
        const headerHeight = 25;
        const usableWidth = pageWidth - (margin * 2);
        const usableHeight = pageHeight - margin - headerHeight - margin;

        // Grid configuration: 5 columns
        const columns = 5;
        const tokenWidth = (usableWidth - (columns - 1) * 3) / columns; // 3pt gap between cards
        const tokenHeight = 100; // Height per token card
        const rowsPerPage = Math.floor(usableHeight / tokenHeight);
        const tokensPerPage = rowsPerPage * columns;

        let tokenIndex = 0;
        let currentPage = 1;

        while (tokenIndex < validTokens.length) {
          if (tokenIndex > 0) {
            doc.addPage();
          }

          // Page header
          doc.fontSize(10)
             .fillColor('#333333')
             .font('Helvetica-Bold')
             .text(`Token Vouchers - Page ${currentPage}`, margin, margin + 5, {
               align: 'center',
               width: usableWidth
             });
          
          doc.fontSize(8)
             .fillColor('#666666')
             .font('Helvetica')
             .text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, margin + 16, {
               align: 'center',
               width: usableWidth
             });

          let yPos = margin + headerHeight + 8;
          const startIndex = tokenIndex;
          const endIndex = Math.min(tokenIndex + tokensPerPage, validTokens.length);

          // Draw grid
          for (let row = 0; row < rowsPerPage && tokenIndex < endIndex; row++) {
            for (let col = 0; col < columns; col++) {
              if (tokenIndex >= validTokens.length) break;

              const token = validTokens[tokenIndex];
              const pkg = packageMap.get(token.package_id);

              const xPos = margin + (col * (tokenWidth + 3)); // 3pt gap between cards
              const cardY = yPos + (row * tokenHeight);

              // Draw token card with clean border
              doc.roundedRect(xPos, cardY, tokenWidth, tokenHeight, 4)
                 .strokeColor('#E5E7EB')
                 .lineWidth(0.5)
                 .stroke()
                 .fillColor('#FFFFFF')
                 .fill();

              // Add QR code at the top (pre-generated)
              const qrSize = 32;
              const qrX = xPos + (tokenWidth / 2) - (qrSize / 2);
              const qrY = cardY + 6;
              
              const qrBuffer = qrCodeMap.get(token.id);
              if (qrBuffer) {
                try {
                  doc.image(qrBuffer, qrX, qrY, {
                    fit: [qrSize, qrSize],
                    align: 'center'
                  });
                } catch (imgError) {
                  console.warn(`Failed to add QR image for token ${token.voucher_code}:`, imgError.message);
                }
              }

              // Instructions (below QR code)
              const instructY = cardY + 40;
              doc.fontSize(6)
                 .fillColor('#4B5563')
                 .font('Helvetica')
                 .text('Username & Password:', xPos + 4, instructY, {
                   width: tokenWidth - 8,
                   align: 'center'
                 });

              // Voucher code
              const codeY = cardY + 50;
              doc.fontSize(8)
                 .fillColor('#000000')
                 .font('Helvetica-Bold')
                 .text(token.voucher_code, xPos + 4, codeY, {
                   width: tokenWidth - 8,
                   align: 'center',
                   ellipsis: false
                 });

              // Package name
              if (pkg) {
                doc.fontSize(7)
                   .font('Helvetica-Bold')
                   .fillColor('#1F2937')
                   .text(pkg.name || 'Package', xPos + 4, cardY + 62, {
                     width: tokenWidth - 8,
                     align: 'center'
                   });

                // Package details - single compact line
                const detailsY = cardY + 72;
                doc.fontSize(5.5)
                   .font('Helvetica')
                   .fillColor('#4B5563')
                   .text(`${pkg.duration_hours}h • ${pkg.data_limit_mb}MB`, xPos + 4, detailsY, {
                     width: tokenWidth - 8,
                     align: 'center'
                   });

                // Price - highlighted at bottom
                doc.fontSize(8)
                   .font('Helvetica-Bold')
                   .fillColor('#2563EB')
                   .text(`$${pkg.price}`, xPos + 4, cardY + 82, {
                     width: tokenWidth - 8,
                     align: 'center'
                   });
              }

              tokenIndex++;
            }
          }

          currentPage++;
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default new PDFService();

