import { createClient } from '@supabase/supabase-js'

const CLICKUP_API = 'https://api.clickup.com/api/v2'
const IDS = {
  designList: Deno.env.get('CLICKUP_DESIGN_LIST_ID') ?? '901309136800',
  videoList: Deno.env.get('CLICKUP_VIDEO_LIST_ID') ?? '901316762308',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

function normalize(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
}

function clickUpHeaders() {
  const token = Deno.env.get('CLICKUP_TOKEN')
  if (!token) throw new Error('CLICKUP_TOKEN não configurado')
  return { Authorization: token, 'Content-Type': 'application/json' }
}

async function getTask(taskId: string) {
  const response = await fetch(`${CLICKUP_API}/task/${taskId}`, { headers: clickUpHeaders() })
  if (!response.ok) throw new Error(`Falha ao buscar tarefa ${taskId}: ${response.status}`)
  return response.json()
}

function professionalForList(listId: string) {
  if (listId === IDS.designList) return 'patricia'
  if (listId === IDS.videoList) return 'anna'
  return null
}

function isValidTransition(professional: string, before: string, after: string) {
  if (normalize(after) !== 'em aprovacao') return false
  const previous = normalize(before)
  if (professional === 'patricia') return previous === 'para fazer'
  return previous === 'para fazer' || previous === 'em andamento'
}

function deadline(task: Record<string, unknown>) {
  const rawDue = Number(task.due_date ?? 0)
  if (!rawDue) return { dueAt: null, hasTime: false, comparableDue: null }

  const hasTime = Boolean(task.due_date_time)
  if (hasTime) {
    return { dueAt: new Date(rawDue).toISOString(), hasTime: true, comparableDue: rawDue }
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(rawDue))
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  const comparableDue = Date.UTC(
    Number(values.year), Number(values.month) - 1, Number(values.day) + 1, 2, 59, 59, 999,
  )
  return { dueAt: new Date(comparableDue).toISOString(), hasTime: false, comparableDue }
}

type HistoryItem = {
  id: string | number
  date: string
  field?: string
  parent_id?: string | number
  user?: { id?: string | number; username?: string; email?: string }
  before?: { status?: string } | null
  after?: { status?: string } | null
}

Deno.serve(async request => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const expectedToken = Deno.env.get('CLICKUP_WEBHOOK_TOKEN')
    const receivedToken = new URL(request.url).searchParams.get('token')
    if (!expectedToken || receivedToken !== expectedToken) {
      return new Response('Unauthorized', { status: 401 })
    }

    const payload = await request.json()
    if (payload.event !== 'taskStatusUpdated') return new Response('ignored')

    const taskId = String(payload.task_id ?? '')
    const webhookId = String(payload.webhook_id ?? '')
    const historyItems: HistoryItem[] = payload.history_items ?? []
    if (!taskId || !webhookId) return new Response('invalid payload', { status: 400 })

    const relevant = historyItems.filter(item => item.field === 'status')
    if (!relevant.length) return new Response('ignored')

    const task = await getTask(taskId)
    const listId = String(task.list?.id ?? relevant[0]?.parent_id ?? '')
    const professional = professionalForList(listId)
    if (!professional) return new Response('ignored')

    const due = deadline(task)
    const rows = relevant.flatMap(item => {
      const before = item.before?.status ?? ''
      const after = item.after?.status ?? ''
      if (!isValidTransition(professional, before, after)) return []

      const changedAtMs = Number(item.date)
      const result = due.comparableDue == null
        ? 'no_due_date'
        : changedAtMs <= due.comparableDue ? 'on_time' : 'late'

      return [{
        event_key: `${webhookId}:${item.id}`,
        webhook_id: webhookId,
        history_item_id: String(item.id),
        task_id: taskId,
        task_name: task.name ?? '(sem nome)',
        task_url: task.url ?? null,
        list_id: listId,
        professional,
        status_before: before,
        status_after: after,
        changed_at: new Date(changedAtMs).toISOString(),
        changed_by_id: item.user?.id != null ? String(item.user.id) : null,
        changed_by_name: item.user?.username ?? item.user?.email ?? 'Não informado',
        due_at: due.dueAt,
        due_has_time: due.hasTime,
        deadline_result: result,
        raw_payload: payload,
      }]
    })

    if (!rows.length) return new Response('ignored')

    const { error } = await supabase
      .from('clickup_delivery_history')
      .upsert(rows, { onConflict: 'event_key', ignoreDuplicates: true })
    if (error) throw error

    return Response.json({ received: true, inserted: rows.length })
  } catch (error) {
    console.error('[clickup-status-webhook]', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Erro inesperado' },
      { status: 500 },
    )
  }
})
