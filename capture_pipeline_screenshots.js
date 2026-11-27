const path = require('path');
const puppeteer = require('d:/HEAL/FINAL/Frontend/node_modules/puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = 'd:/HEAL/FINAL/docs_website/screenshots';

const AUTH_DATA = {
  state: {
    token: 'mock-jwt-token-admin',
    user: {
      id: 'staff-admin-001',
      name: 'Dr. Shahnaz (Clinic Director)',
      full_name: 'Dr. Shahnaz (Clinic Director)',
      role: 'Super Admin',
      branch_id: 'krn-branch-001',
      branch_name: 'Karanthoor (Flagship)',
      username: 'admin',
    },
    isAuthenticated: true,
  },
  version: 0,
};

async function setupPage(page) {
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluateOnNewDocument((auth) => {
    localStorage.setItem('heal-auth', JSON.stringify(auth));
    localStorage.setItem('heal-auth-storage', JSON.stringify(auth));
    localStorage.setItem('HEAL_ACTIVE_BRANCH', 'krn-branch-001');
    sessionStorage.setItem('HEAL_ACTIVE_BRANCH_TAB', 'krn-branch-001');
  }, AUTH_DATA);
}

async function run() {
  console.log('Launching headless Chrome for screenshot capture...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  const page = await browser.newPage();
  await setupPage(page);

  const targets = [
    {
      name: '01_reception_register.png',
      url: 'https://healh-software.netlify.app/reception/register',
      wait: 3000,
    },
    {
      name: '02_nurse_triage.png',
      url: 'https://healh-software.netlify.app/reception/queue',
      wait: 3000,
    },
    {
      name: '03_doctor_workbench_consultation.png',
      url: 'https://healh-software.netlify.app/clinical/doctor',
      wait: 4000,
    },
    {
      name: '04_doctor_returned_results.png',
      url: 'https://healh-software.netlify.app/clinical/doctor',
      wait: 4000,
      action: async (p) => {
        try {
          const buttons = await p.$$('button');
          for (const btn of buttons) {
            const text = await p.evaluate((el) => el.textContent, btn);
            if (text && text.includes('Returned with Results')) {
              await btn.click();
              await new Promise((r) => setTimeout(r, 1500));
              break;
            }
          }
        } catch (e) {}
      },
    },
    {
      name: '05_diagnostics_lab.png',
      url: 'https://healh-software.netlify.app/clinical/lab',
      wait: 3000,
    },
    {
      name: '06_radiology_imaging.png',
      url: 'https://healh-software.netlify.app/clinical/imaging',
      wait: 3000,
    },
    {
      name: '07_pharmacy_dispensary.png',
      url: 'https://healh-pharmacy.netlify.app/pharmacy/dispensary',
      wait: 3000,
    },
    {
      name: '08_pharmacy_walkin_sale.png',
      url: 'https://healh-pharmacy.netlify.app/pharmacy/dispensary',
      wait: 3000,
      action: async (p) => {
        try {
          const buttons = await p.$$('button');
          for (const btn of buttons) {
            const text = await p.evaluate((el) => el.textContent, btn);
            if (text && text.includes('Direct Walk-In Sale')) {
              await btn.click();
              await new Promise((r) => setTimeout(r, 1500));
              break;
            }
          }
        } catch (e) {}
      },
    },
    {
      name: '09_billing_pos.png',
      url: 'https://healh-software.netlify.app/billing/pos',
      wait: 3000,
    },
    {
      name: '10_patient_portal_login.png',
      url: 'https://healh-patient.netlify.app',
      wait: 3000,
    },
    {
      name: '11_hrms_rosters.png',
      url: 'https://healh-hrms.netlify.app/hrms',
      wait: 3000,
    },
  ];

  for (const t of targets) {
    try {
      console.log(`Navigating to ${t.url} -> ${t.name}...`);
      await page.goto(t.url, { waitUntil: 'networkidle0', timeout: 25000 });
      if (t.wait) await new Promise((r) => setTimeout(r, t.wait));
      if (t.action) await t.action(page);
      const outPath = path.join(OUT_DIR, t.name);
      await page.screenshot({ path: outPath, fullPage: false });
      console.log(`Saved: ${t.name}`);
    } catch (err) {
      console.error(`Error capturing ${t.name}:`, err.message);
    }
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
}

run();
