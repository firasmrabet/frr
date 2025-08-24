#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--id' || a === '-i') out.id = args[++i];
    else if (a === '--field' || a === '-f') out.field = args[++i];
    else if (a === '--value' || a === '-v') out.value = args[++i];
    else if (a === '--file' || a === '-F') out.file = args[++i];
    else if (a === '--dry-run' || a === '-d') out.dry = true;
  else if (a === '--backup' || a === '-B') out.backup = true;
  else if (a === '--backup-file' || a === '-b') out.backupFile = args[++i];
  else if (a === '--restore-file' || a === '-r') out.restoreFile = args[++i];
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

function usage() {
  console.log(`Usage: node test/verify-update-product.mjs --id <product-id> --field <fieldName> --value <value>

Examples:
  # update price
  $env:SUPABASE_URL = 'https://xyz.supabase.co'; $env:SUPABASE_SERVICE_KEY = 'service-role-key'; node test/verify-update-product.mjs --id 1234-abcd --field price --value 250

  # update characteristics (pass JSON)
  $env:SUPABASE_URL = 'https://xyz.supabase.co'; $env:SUPABASE_SERVICE_KEY = 'service-role-key'; node test/verify-update-product.mjs --id 1234-abcd --field characteristics --value '{"Puissance":"100kVA","Tension":"400V"}'

Notes:
  - The script reads SUPABASE_URL and SUPABASE_SERVICE_KEY from environment variables.
  - Use the service role key for server-side updates when RLS restricts updates.
`);
}

async function main() {
  const { id, field, value, file, dry, backup, backupFile, restoreFile, help } = parseArgs();
  if (help || !id || (!field && !file)) {
    usage();
    process.exit(help ? 0 : 1);
  }

  // If restore requested, we'll read the backup file and use its content as payload
  if (restoreFile) {
    try {
      const buf = await fs.readFile(restoreFile, 'utf8');
      const parsed = JSON.parse(buf);
      // avoid changing primary key
      delete parsed.id;
      const payload = { ...parsed };
      console.log('Restore payload loaded from file:', restoreFile);

      if (process.argv.includes('--dry-run') || process.argv.includes('-d') || dry) {
        console.log(`Dry run enabled — no restore will be performed. Payload:\n${JSON.stringify(payload, null, 2)}`);
        process.exit(0);
      }

      const SUPABASE_URL = process.env.SUPABASE_URL;
      const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
      if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_KEY) must be set in environment.');
        process.exit(2);
      }
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

      console.log('Restoring product from file...');
      const { data: restored, error: restoreErr } = await supabase
        .from('custom_products')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (restoreErr) throw restoreErr;
      console.log('Restore result:', JSON.stringify(restored, null, 2));
      process.exit(0);
    } catch (e) {
      console.error('Failed to restore from file:', e);
      process.exit(7);
    }
  }

  // Prepare update payload: either single field/value or a JSON file with full payload
  let payload = { updated_at: new Date().toISOString() };
  if (file) {
    try {
      const buf = await fs.readFile(file, 'utf8');
      const parsed = JSON.parse(buf);
      payload = { ...payload, ...parsed };
    } catch (e) {
      console.error('Failed to read/parse --file JSON:', e.message || e);
      process.exit(6);
    }
    console.log('Prepared payload from file:', JSON.stringify(payload, null, 2));
  } else {
    let parsedValue = value;
  if (field === 'price') {
      parsedValue = Number(value);
  } else if (field === 'stock') {
    parsedValue = Number(value);
    } else if (field === 'characteristics' || field === 'variations' || field === 'images') {
      try {
        parsedValue = JSON.parse(value);
      } catch (e) {
        console.error('For characteristics/variations/images provide a valid JSON string as --value');
        process.exit(4);
      }
    }
    payload[field] = parsedValue;
    console.log('Prepared single-field payload:', { [field]: parsedValue });
  }

  // If backup requested, save the current row before updating
  const backupPath = backupFile || `test/backup-${id}.json`;

  // Dry-run mode: just print payload and exit
  if (process.argv.includes('--dry-run') || process.argv.includes('-d') || dry) {
    console.log(`Dry run enabled — no update will be performed. Payload:\n${JSON.stringify(payload, null, 2)}`);
    console.log(`If --backup was provided, backup would be written to: ${backupPath}`);
    process.exit(0);
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_KEY) must be set in environment.');
    process.exit(2);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

  try {
    console.log('Fetching product before update...');
    const { data: before, error: fetchErr } = await supabase
      .from('custom_products')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchErr) throw fetchErr;
    if (!before) {
      console.error('Product not found with id:', id);
      process.exit(3);
    }
    console.log('Before:', JSON.stringify(before, null, 2));

    if (backup) {
      try {
        await fs.writeFile(backupPath, JSON.stringify(before, null, 2), 'utf8');
        console.log('Backup saved to', backupPath);
      } catch (e) {
        console.error('Failed to write backup file:', e);
        process.exit(8);
      }
    }

    console.log('Updating product...', { id, payload });
    const { data: updated, error: updateErr } = await supabase
      .from('custom_products')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (updateErr) throw updateErr;
    console.log('Update result:', JSON.stringify(updated, null, 2));

    console.log('Fetching product after update...');
    const { data: after, error: afterErr } = await supabase
      .from('custom_products')
      .select('*')
      .eq('id', id)
      .single();
    if (afterErr) throw afterErr;
    console.log('After:', JSON.stringify(after, null, 2));

    // Simple verification
    const beforeVal = before[field];
    const afterVal = after[field];
    const same = JSON.stringify(beforeVal) === JSON.stringify(afterVal);
    if (!same) {
      console.log('SUCCESS: Field changed.');
      process.exit(0);
    } else {
      console.error('FAIL: Field did not change.');
      process.exit(5);
    }
  } catch (err) {
    console.error('Error during verification:', err);
    process.exit(10);
  }
}

main();
