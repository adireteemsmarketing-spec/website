/**
 * Seed test accounts into Supabase (auth + profiles)
 *
 * Requirements:
 *  - Node 18+
 *  - Set env: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (service_role key)
 *
 * Run: node scripts/seed_test_accounts.js
 */

import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in env');
  process.exit(1);
}

const api = (path) => `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1${path}`;

async function createUser(email, password) {
  const res = await fetch(api('/admin/users'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function upsertProfile({ user_id, email, role, location_id = null, full_name = null }) {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/profiles`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ user_id, email, role, location_id, full_name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function seed() {
  try {
    const accounts = [
      { email: 'superadmin@local.test', password: 'SuperAdmin@123', role: 'super_admin', location_id: null, full_name: 'Super Admin' },
      { email: 'admin@local.test', password: 'Admin@1234', role: 'admin', location_id: null, full_name: 'Admin User' },
      { email: 'sales.lagos@local.test', password: 'SalesLagos@1', role: 'sales_rep', location_id: 1, full_name: 'Sales Lagos' },
      { email: 'sales.abuja@local.test', password: 'SalesAbuja@1', role: 'sales_rep', location_id: 2, full_name: 'Sales Abuja' },
      { email: 'test.user@local.test', password: 'Buyer@123', role: 'user', location_id: null, full_name: 'Test Buyer' },
    ];

    for (const acc of accounts) {
      console.log('Creating user', acc.email);
      const user = await createUser(acc.email, acc.password);
      const user_id = user.id || user.user?.id;
      if (!user_id) {
        console.warn('Could not get user id for', acc.email, user);
        continue;
      }
      console.log('Upserting profile for', acc.email, 'user_id=', user_id);
      await upsertProfile({ user_id, email: acc.email, role: acc.role, location_id: acc.location_id, full_name: acc.full_name });
      console.log('Seeded', acc.email);
    }

    console.log('All accounts seeded. Rotate dev passwords before staging/production.');
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
