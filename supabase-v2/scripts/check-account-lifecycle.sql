\set ON_ERROR_STOP on
BEGIN;

SELECT gen_random_uuid() AS user_a \gset
SELECT gen_random_uuid() AS user_b \gset
SELECT gen_random_uuid() AS chat_a \gset
SELECT gen_random_uuid() AS chat_b \gset
SELECT gen_random_uuid() AS payment_a \gset

INSERT INTO auth.users (id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
VALUES
  (:'user_a','authenticated','authenticated','nova2-a-' || :'user_a' || '@example.test','','now','{}','{}',now(),now()),
  (:'user_b','authenticated','authenticated','nova2-b-' || :'user_b' || '@example.test','','now','{}','{}',now(),now());

INSERT INTO public.profiles(id,display_name) VALUES
  (:'user_a','Synthetic A'), (:'user_b','Synthetic B');
INSERT INTO public.chats(id,user_id,title) VALUES
  (:'chat_a',:'user_a','Export fixture A'),
  (:'chat_b',:'user_b','Private fixture B');
INSERT INTO public.messages(chat_id,user_id,role,content) VALUES
  (:'chat_a',:'user_a','user','Synthetic message A'),
  (:'chat_b',:'user_b','user','Private message B');
INSERT INTO public.files(user_id,kind,mime,size_bytes,storage_key,consent_at,expires_at) VALUES
  (:'user_a','document','text/plain',12,:'user_a' || '/test.txt',now(),now()+interval '1 hour');
INSERT INTO public.wallets(user_id,balance_credits) VALUES (:'user_a',0),( :'user_b',0);
INSERT INTO public.ledger_entries(user_id,delta_credits,reason,ref_type,ref_id) VALUES
  (:'user_a',17,'topup','order','export-order-a');
INSERT INTO public.mock_payments(id,user_id,mock_order_id,amount_paise,status) VALUES
  (:'payment_a',:'user_a','export-mock-order-a',4900,'captured');
INSERT INTO public.payment_events(event_id,mock_payment_id,event_type,payload_hash) VALUES
  ('export-event-a',:'payment_a','payment.captured','fixture-hash-a');
INSERT INTO public.usage_events(user_id,feature,model,input_units,output_units,cost_paise,latency_ms,ok) VALUES
  (:'user_a','sakha','mock',10,4,0,20,true),
  (:'user_b','sakha','mock',11,5,0,21,true);
INSERT INTO public.diwan_jobs(user_id,kind,status,input_ref,output_json) VALUES
  (:'user_a','paper_reader','complete','synthetic-file-a','{"mode":"fixture"}'),
  (:'user_b','scam_check','complete','synthetic-file-b','{"mode":"private"}');

-- Export reads performed as an authenticated owner must see only that owner's rows.
SELECT set_config('request.jwt.claim.sub', :'user_a', true);
SELECT set_config('nova2.test.user_b', :'user_b', true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM public.profiles;
  IF n <> 1 THEN RAISE EXCEPTION 'RLS_PROFILE_ISOLATION_FAIL:%', n; END IF;
  SELECT count(*) INTO n FROM public.chats;
  IF n <> 1 THEN RAISE EXCEPTION 'RLS_CHAT_EXPORT_ISOLATION_FAIL:%', n; END IF;
  SELECT count(*) INTO n FROM public.messages;
  IF n <> 1 THEN RAISE EXCEPTION 'RLS_MESSAGE_EXPORT_ISOLATION_FAIL:%', n; END IF;
  SELECT count(*) INTO n FROM public.files;
  IF n <> 1 THEN RAISE EXCEPTION 'RLS_FILE_EXPORT_ISOLATION_FAIL:%', n; END IF;
  SELECT count(*) INTO n FROM public.wallets;
  IF n <> 1 THEN RAISE EXCEPTION 'RLS_WALLET_EXPORT_ISOLATION_FAIL:%', n; END IF;
  SELECT count(*) INTO n FROM public.ledger_entries;
  IF n <> 1 THEN RAISE EXCEPTION 'RLS_LEDGER_EXPORT_ISOLATION_FAIL:%', n; END IF;
  SELECT count(*) INTO n FROM public.mock_payments;
  IF n <> 1 THEN RAISE EXCEPTION 'RLS_PAYMENT_EXPORT_ISOLATION_FAIL:%', n; END IF;
  SELECT count(*) INTO n FROM public.usage_events;
  IF n <> 1 THEN RAISE EXCEPTION 'RLS_USAGE_EXPORT_ISOLATION_FAIL:%', n; END IF;
  SELECT count(*) INTO n FROM public.diwan_jobs;
  IF n <> 1 THEN RAISE EXCEPTION 'RLS_DIWAN_EXPORT_ISOLATION_FAIL:%', n; END IF;
  IF EXISTS (SELECT 1 FROM public.messages WHERE content='Private message B') THEN
    RAISE EXCEPTION 'EXPORT_LEAKED_OTHER_USER_MESSAGE';
  END IF;
  BEGIN
    INSERT INTO public.chats(user_id,title) VALUES (current_setting('nova2.test.user_b')::uuid,'unauthorized');
    RAISE EXCEPTION 'RLS_CROSS_USER_WRITE_WAS_NOT_BLOCKED';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END $$;
RESET ROLE;

-- Deletion test uses a synthetic auth.users row. FK cascades remove owned data;
-- non-identifying usage telemetry is retained with user_id anonymised to NULL.
DELETE FROM auth.users WHERE id=:'user_a';
DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM public.profiles WHERE display_name='Synthetic A';
  IF n <> 0 THEN RAISE EXCEPTION 'DELETE_PROFILE_CASCADE_FAIL'; END IF;
  SELECT count(*) INTO n FROM public.chats WHERE title='Export fixture A';
  IF n <> 0 THEN RAISE EXCEPTION 'DELETE_CHAT_CASCADE_FAIL'; END IF;
  SELECT count(*) INTO n FROM public.messages WHERE content='Synthetic message A';
  IF n <> 0 THEN RAISE EXCEPTION 'DELETE_MESSAGE_CASCADE_FAIL'; END IF;
  SELECT count(*) INTO n FROM public.files WHERE storage_key LIKE '%/test.txt';
  IF n <> 0 THEN RAISE EXCEPTION 'DELETE_FILE_METADATA_CASCADE_FAIL'; END IF;
  SELECT count(*) INTO n FROM public.wallets WHERE balance_credits=17;
  IF n <> 0 THEN RAISE EXCEPTION 'DELETE_WALLET_CASCADE_FAIL'; END IF;
  SELECT count(*) INTO n FROM public.ledger_entries WHERE ref_id='export-order-a';
  IF n <> 0 THEN RAISE EXCEPTION 'DELETE_LEDGER_CASCADE_FAIL'; END IF;
  SELECT count(*) INTO n FROM public.mock_payments WHERE mock_order_id='export-mock-order-a';
  IF n <> 0 THEN RAISE EXCEPTION 'DELETE_PAYMENT_CASCADE_FAIL'; END IF;
  SELECT count(*) INTO n FROM public.payment_events WHERE event_id='export-event-a';
  IF n <> 0 THEN RAISE EXCEPTION 'DELETE_PAYMENT_EVENT_CASCADE_FAIL'; END IF;
  SELECT count(*) INTO n FROM public.diwan_jobs WHERE input_ref='synthetic-file-a';
  IF n <> 0 THEN RAISE EXCEPTION 'DELETE_DIWAN_CASCADE_FAIL'; END IF;
  SELECT count(*) INTO n FROM public.usage_events WHERE user_id IS NULL AND feature='sakha';
  IF n <> 1 THEN RAISE EXCEPTION 'DELETE_USAGE_ANONYMISATION_FAIL:%', n; END IF;
END $$;
DELETE FROM auth.users WHERE id=:'user_b';
ROLLBACK;

SELECT 'ACCOUNT_EXPORT_RLS_ISOLATION_PASS' AS result;
SELECT 'ACCOUNT_DELETE_CASCADE_AND_USAGE_ANONYMISATION_PASS' AS result;
