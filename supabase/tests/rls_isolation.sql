\set ON_ERROR_STOP on
-- Reuse the established isolated two-user and multi-tenant RLS integration suite.
-- Run from any working directory; psql resolves this include relative to this file.
\ir ../../scripts/supabase-rls-integration.sql
