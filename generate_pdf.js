const path = require('path');
const puppeteer = require('d:/HEAL/FINAL/Frontend/node_modules/puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const HTML_PATH = 'file:///' + path.resolve('d:/HEAL/FINAL/docs_website/manual_pdf_template.html').replace(/\\/g, '/');
const PDF_OUT = 'd:/HEAL/FINAL/HEALESTHETIC_Doctor_and_Manager_Manual.pdf';

async function generatePdf() {
  console.log('Launching headless Chrome to render PDF...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1800, deviceScaleFactor: 2 });

  console.log('Loading HTML template from:', HTML_PATH);
  await page.goto(HTML_PATH, { waitUntil: 'networkidle0', timeout: 30000 });

  // Wait 2 seconds to ensure webfonts and screenshot images are fully rendered
  await new Promise((r) => setTimeout(r, 2500));

  console.log('Generating high-resolution PDF...');
  await page.pdf({
    path: PDF_OUT,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-size: 6.5pt; font-family: sans-serif; color: #94a3b8; width: 100%; text-align: right; padding: 5px 12mm 0 0; font-weight: 600; letter-spacing: 0.05em;">
        HEALESTHETIC CLINICAL OS &bull; MANAGER &amp; DOCTOR MANUAL
      </div>
    `,
    footerTemplate: `
      <div style="font-size: 7pt; font-family: sans-serif; color: #94a3b8; width: 100%; display: flex; justify-content: space-between; padding: 0 12mm 5px; font-weight: 600;">
        <span style="color: #64748b;">HEALESTHETIC Healthcare Group</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `,
    margin: {
      top: '12mm',
      bottom: '14mm',
      left: '12mm',
      right: '12mm',
    },
  });

  await browser.close();
  console.log('PDF generated successfully at:', PDF_OUT);
}

generatePdf().catch((err) => {
  console.error('Failed to generate PDF:', err);
  process.exit(1);
});
