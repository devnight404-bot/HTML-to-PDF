const express = require('express');
const router = express.Router();
const validateRequest = require('../middleware/validateRequest');
const { convertHtmlToPdf } = require('../services/pdfService');

/**
 * POST /api/convert-pdf
 *
 * Request body:
 *   { html: "<html>...</html>", options: { format: "A4", landscape: false } }
 *
 * Response:
 *   Raw PDF binary with Content-Type: application/pdf
 */
router.post('/convert-pdf', validateRequest, async (req, res) => {
  try {
    const { html, options } = req.body;

    const pdfBuffer = await convertHtmlToPdf(html, options || {});

    // Send the PDF as binary response
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation failed:', error.message);
    res.status(500).json({ error: 'PDF generation failed', details: error.message });
  }
});

module.exports = router;
