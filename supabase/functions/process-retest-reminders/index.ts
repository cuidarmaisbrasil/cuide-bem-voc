import { createClient } from 'npm:@supabase/supabase-js@2'

// Processes pending retest reminders whose scheduled_at <= now().
// Triggered by pg_cron every minute.

Deno.serve(async (_req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: due, error: queryError } = await supabase
    .from('retest_reminders')
    .select('id, email, severity')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .limit(50)

  if (queryError) {
    console.error('query failed', queryError)
    return new Response(JSON.stringify({ error: queryError.message }), {
      status: 500,
    })
  }

  let sent = 0
  let failed = 0

  for (const row of due ?? []) {
    const { error: invokeError } = await supabase.functions.invoke(
      'send-transactional-email',
      {
        body: {
          templateName: 'retest-reminder',
          recipientEmail: row.email,
          idempotencyKey: `retest-reminder-${row.id}`,
          templateData: { severity: row.severity },
        },
      },
    )

    if (invokeError) {
      failed++
      await supabase
        .from('retest_reminders')
        .update({
          status: 'failed',
          error_message: invokeError.message ?? 'invoke failed',
        })
        .eq('id', row.id)
    } else {
      sent++
      await supabase
        .from('retest_reminders')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', row.id)
    }
  }

  return new Response(JSON.stringify({ processed: due?.length ?? 0, sent, failed }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
