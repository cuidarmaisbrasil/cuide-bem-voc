
-- 1) Fix search_path on pgmq helper functions
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pgmq
AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pgmq
AS $$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pgmq
AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pgmq
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN PERFORM pgmq.create(dlq_name); EXCEPTION WHEN OTHERS THEN NULL; END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN PERFORM pgmq.delete(source_queue, message_id); EXCEPTION WHEN undefined_table THEN NULL; END;
  RETURN new_id;
END;
$$;

-- 2) Revoke EXECUTE from anon/authenticated/public on functions that should only run from
--    edge functions (service_role) or as triggers. has_role MUST remain executable for RLS.
REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_first_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 3) Tighten "always true" INSERT policies on analytics intake tables
DROP POLICY IF EXISTS "Anyone can insert link clicks" ON public.link_clicks;
CREATE POLICY "Anyone can insert link clicks"
ON public.link_clicks FOR INSERT TO anon, authenticated
WITH CHECK (
  link_type IS NOT NULL
  AND char_length(link_type) BETWEEN 1 AND 64
  AND (target_id IS NULL OR char_length(target_id) <= 128)
  AND (target_label IS NULL OR char_length(target_label) <= 256)
  AND (referrer IS NULL OR char_length(referrer) <= 2048)
  AND (landing_path IS NULL OR char_length(landing_path) <= 2048)
);

DROP POLICY IF EXISTS "Anyone can insert test events" ON public.test_events;
CREATE POLICY "Anyone can insert test events"
ON public.test_events FOR INSERT TO anon, authenticated
WITH CHECK (
  (score IS NULL OR (score BETWEEN 0 AND 27))
  AND (functional_impact IS NULL OR (functional_impact BETWEEN 0 AND 3))
  AND (age IS NULL OR (age BETWEEN 0 AND 120))
  AND (severity IS NULL OR char_length(severity) <= 32)
  AND (referrer IS NULL OR char_length(referrer) <= 2048)
  AND (landing_path IS NULL OR char_length(landing_path) <= 2048)
);
