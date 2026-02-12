const puppeteer = require('puppeteer');

// We store the browser instance here so we can reuse it across requests.
// Launching Chrome takes ~1-2 seconds. If we launched it per request,
// every PDF would take 1-2 extra seconds. By reusing one browser instance,
// only the first request is slow — the rest are fast.
let browser = null;

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
 * @param {object} options - PDF options (format, landscape, etc.)
 * @returns {Buffer} - The raw PDF binary data
 */
async function convertHtmlToPdf(html, options = {}) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // setContent loads the HTML into the page (like pasting it into a browser tab)
    await page.setContent(html, {
      waitUntil: 'networkidle0',  // Wait until all resources (images, fonts) are loaded
    });

    // Generate PDF buffer (not saved to file — kept in memory)
    const pdfBuffer = await page.pdf({
      format: options.format || 'A4',
      landscape: options.landscape || false,
      printBackground: true,          // Include CSS backgrounds & gradients
      margin: options.margin || { top: 0, right: 0, bottom: 0, left: 0 },
    });

    return pdfBuffer;
  } finally {
    // Always close the page to free memory, even if an error occurred
    await page.close();
  }
}

module.exports = { convertHtmlToPdf };
