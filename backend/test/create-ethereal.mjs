import nodemailer from 'nodemailer';
import { execFile } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const OUT_CREDS = path.join(process.cwd(), 'test', 'ethereal-creds.json');
const OUT_LOG = path.join(process.cwd(), 'test', 'ethereal-run.log');

(async () => {
  try {
    const acct = await nodemailer.createTestAccount();
    const creds = {
      smtp: acct.smtp,
      user: acct.user,
      pass: acct.pass
    };
    await fs.writeFile(OUT_CREDS, JSON.stringify(creds, null, 2), 'utf8');
    console.log('Wrote Ethereal creds to', OUT_CREDS);

    const env = { ...process.env };
    env.SMTP_HOST = acct.smtp.host;
    env.SMTP_PORT = String(acct.smtp.port);
    env.SMTP_USER = acct.user;
    env.SMTP_PASS = acct.pass;
    env.RECEIVER_EMAIL = acct.user;
    env.API_KEY = 'test-api-key';

    // Run test script and capture output to file
    console.log('Running test/test-send-quote.mjs with Ethereal creds; output will be saved to', OUT_LOG);
    const child = execFile('node', ['test/test-send-quote.mjs'], { cwd: process.cwd(), env });

    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (d) => { stdout += d.toString(); });
    child.stderr?.on('data', (d) => { stderr += d.toString(); });
    child.on('close', async (code) => {
      const out = {
        exitCode: code,
        stdout,
        stderr
      };
      await fs.writeFile(OUT_LOG, JSON.stringify(out, null, 2), 'utf8');
      console.log('Test run complete; log written to', OUT_LOG);
    });

  } catch (e) {
    console.error('Error creating ethereal account', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
