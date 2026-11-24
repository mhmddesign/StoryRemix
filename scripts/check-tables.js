const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const client = createClient(url, key);

async function run() {
  console.log('Testing Supabase connection...');
  const tests = [
    'profiles',
    'stories',
    'referral_codes',
    'referral_events',
    'wallets',
    'wallet_transactions',
    'gift_catalog',
    'gift_transactions',
    'payment_packages'
  ];

  for (const t of tests) {
    const { data, error } = await client.from(t).select('*').limit(1);
    console.log(`Table ${t}: ${error ? 'ERROR: ' + error.message : 'OK (' + (data ? data.length : 0) + ' rows)'}`);
  }
}

run().catch(console.error);
