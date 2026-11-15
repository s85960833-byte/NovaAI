import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const url = process.env.NOVA_RLS_TEST_DATABASE_URL || '';
const environment = process.env.NOVA_RLS_TEST_ENV || '';
const confirmation = process.env.NOVA_RLS_CONFIRM_THROWAWAY || '';

if (!url || environment !== 'throwaway' || confirmation !== 'I_AM_USING_A_THROWAWAY_DATABASE') {
  console.error('BLOCKED-HUMAN: set NOVA_RLS_TEST_ENV=throwaway, NOVA_RLS_CONFIRM_THROWAWAY=I_AM_USING_A_THROWAWAY_DATABASE, and NOVA_RLS_TEST_DATABASE_URL for an isolated disposable database.');
  process.exitCode = 2;
} else {
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error('NOVA_RLS_TEST_DATABASE_URL must be a valid PostgreSQL URL'); }
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) throw new Error('NOVA_RLS_TEST_DATABASE_URL must use PostgreSQL');
  if (url.includes('qrfwsewppafhxibdboam')) throw new Error('Refusing to run RLS fixtures against the configured NOVA project identifier');
  const here = path.dirname(fileURLToPath(import.meta.url));
  const sql = path.resolve(here, '../supabase/tests/rls_isolation.sql');
  const result = spawnSync('psql', ['--no-psqlrc', '--set', 'ON_ERROR_STOP=1', '--dbname', url, '--file', sql], {
    stdio: 'inherit',
    env: process.env
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exitCode = result.status || 1;
  else console.log('PASS isolated Supabase-compatible two-user RLS isolation suite');
}
