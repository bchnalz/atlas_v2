import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { Bot, webhookCallback } from 'https://deno.land/x/grammy@v1.21.1/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

interface ReqPayload {
  task_number?: string
  title?: string
  priority?: string
  telegram_id?: string
  action?: string
  task_id?: string
}

const bot = new Bot(Deno.env.get('TELEGRAM_BOT_TOKEN') || '')
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
)

// /link — generate one-time code
bot.command('link', async (ctx) => {
  const code = crypto.randomUUID().slice(0, 8)
  const tgId = String(ctx.from?.id)
  // Store mapping in a temp table or use a simple cache
  // For now, store directly in profiles if user matches
  await ctx.reply(
    `🔗 Link your ATLAS account\n\nYour code: *${code}*\n\nGo to ATLAS Profile page and enter this code to link your Telegram account.`,
    { parse_mode: 'Markdown' },
  )
})

// /unlink
bot.command('unlink', async (ctx) => {
  const tgId = String(ctx.from?.id)
  await supabase.from('profiles').update({ telegram_id: null }).eq('telegram_id', tgId)
  await ctx.reply('✅ Telegram unlinked from your ATLAS account.')
})

// Start
bot.command('start', async (ctx) => {
  await ctx.reply(
    '🤖 *ATLAS Bot*\n\nCommands:\n/link — Link your ATLAS account\n/unlink — Unlink Telegram\n\nNotifications about task assignments will be sent automatically.',
    { parse_mode: 'Markdown' },
  )
})

// Handle task notifications (called via Supabase webhook)
async function sendTaskNotification(payload: ReqPayload) {
  if (!payload.telegram_id) return
  const priorityEmoji: Record<string, string> = {
    urgent: '🔴',
    high: '🟠',
    normal: '🔵',
    low: '⚪',
  }
  const emoji = priorityEmoji[payload.priority || 'normal'] || '🔵'

  try {
    await bot.api.sendMessage(
      Number(payload.telegram_id),
      `${emoji} *New Task Assigned*\n\n📋 *${payload.title}*\n🏷️ ${payload.task_number}\n\nView: https://app.atlas/tasks/${payload.task_id}`,
      { parse_mode: 'Markdown' },
    )
  } catch (err) {
    console.error('Failed to send Telegram notification:', err)
  }
}

// HTTP handler
const handler = webhookCallback(bot, 'std/http')

serve(async (req) => {
  // Check if it's a webhook callback from Telegram
  const url = new URL(req.url)

  // Internal API endpoint for sending notifications
  if (url.pathname === '/notify' && req.method === 'POST') {
    const payload: ReqPayload = await req.json()
    await sendTaskNotification(payload)
    return new Response('ok', { status: 200 })
  }

  // Telegram webhook
  return handler(req)
})
