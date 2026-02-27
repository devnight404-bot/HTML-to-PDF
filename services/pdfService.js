const puppeteer = require('puppeteer');

// We store the browser instance here so we can reuse it across requests.
// Launching Chrome takes ~1-2 seconds. If we launched it per request,
// every PDF would take 1-2 extra seconds. By reusing one browser instance,
// only the first request is slow — the rest are fast.
let browser = null;

// ─── XD Design Coordinate System ────────────────────────────────────
// A4 at 300 DPI = 2480 × 3508 px. XD designs use this coordinate system.
// Puppeteer renders at 96 DPI where A4 = ~794 × 1123 px.
// Scale factor: 794 / 2480 ≈ 0.32 — shrinks the 300 DPI layout to fit A4.
// When enabled, font sizes and dimensions from XD can be used directly in CSS.
const XD_A4 = {
  width: 2480,
  height: 3508,
  scale: 0.32,
};

/**
 * Get or create a browser instance.
 * If the browser crashed or was closed, it creates a new one.
 */
async function getBrowser() {
  if (!browser || !browser.isConnected()) {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',   // Prevents crashes in Docker containers
        '--disable-gpu',
      ],
    });
  }
  return browser;
}

/**
 * Converts an HTML string to a PDF buffer.
 *
 * @param {string} html - The complete HTML to render
 * @param {object} options - PDF options:
 *   - format {string}    Paper format, e.g. 'A4' (default: 'A4')
 *   - landscape {bool}   Landscape orientation (default: false)
 *   - margin {object}    Page margins (default: all zero)
 *   - useXdScale {bool}  Enable XD 300-DPI coordinate system (default: false)
 *                         Sets viewport to 2480×3508 and scale to 0.32
 *                         so XD pixel values can be used directly in CSS.
 *   - viewport {object}  Custom viewport { width, height } (overrides useXdScale)
 *   - scale {number}     Content scale 0.1–2.0 (overrides useXdScale)
 * @returns {Buffer} - The raw PDF binary data
 */
async function convertHtmlToPdf(html, options = {}) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // ── Viewport ──────────────────────────────────────────────────
    // Determines the CSS pixel dimensions the HTML is rendered at.
    // Default Puppeteer viewport is 800×600 which matches the old
    // 210mm body width (~794px at 96 DPI).
    // When useXdScale is true, we switch to 2480×3508 (A4 at 300 DPI).
    let viewport = null;
    let pdfScale = 1;

    if (options.useXdScale) {
      viewport = { width: XD_A4.width, height: XD_A4.height };
      pdfScale = XD_A4.scale;
    }

    // Explicit viewport/scale in options override useXdScale
    if (options.viewport) {
      viewport = {
        width: options.viewport.width || (viewport ? viewport.width : 800),
        height: options.viewport.height || (viewport ? viewport.height : 600),
      };
    }
    if (options.scale) {
      pdfScale = options.scale;
    }

    if (viewport) {
      await page.setViewport(viewport);
    }

    // ── Load HTML ─────────────────────────────────────────────────
    await page.setContent(html, {
      waitUntil: 'networkidle0',  // Wait until all resources (images, fonts) are loaded
    });

    // ── Generate PDF ──────────────────────────────────────────────
    const pdfBuffer = await page.pdf({
      format: options.format || 'A4',
      landscape: options.landscape || false,
      printBackground: true,
      margin: options.margin || { top: 0, right: 0, bottom: 0, left: 0 },
      scale: pdfScale,
    });

    return pdfBuffer;
  } finally {
    // Always close the page to free memory, even if an error occurred
    await page.close();
  }
}

module.exports = { convertHtmlToPdf };
