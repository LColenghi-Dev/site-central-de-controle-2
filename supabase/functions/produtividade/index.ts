import { createClient } from '@supabase/supabase-js'

const CLICKUP_API = 'https://api.clickup.com/api/v2'

const IDS = {
  designList: Deno.env.get('CLICKUP_DESIGN_LIST_ID') ?? '901309136800',
  videoList: Deno.env.get('CLICKUP_VIDEO_LIST_ID') ?? '901316762308',
  schedulingList: Deno.env.get('CLICKUP_SCHEDULING_LIST_ID') ?? '901309136799',
  clientsFolder: Deno.env.get('CLICKUP_CLIENTS_FOLDER_ID') ?? '901316274945',
  patricia: Deno.env.get('CLICKUP_PATRICIA_ID') ?? '61027168',
  anna: Deno.env.get('CLICKUP_ANNA_ID') ?? '82120539',
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

function normalize(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function statusIs(task: ClickUpTask, expected: string) {
  return normalize(task.status?.status) === normalize(expected)
}

function hasAssignee(task: ClickUpTask, assigneeId: string) {
  return (task.assignees ?? []).some(person => String(person.id) === String(assigneeId))
}

function customFieldHasPerson(
  task: ClickUpTask,
  fieldName: string,
  personId: string,
  personName: string,
) {
  const field = (task.custom_fields ?? []).find(
    item => normalize(item.name) === normalize(fieldName),
  )
  if (!field || field.value == null) return false

  const expectedId = String(personId)
  const expectedName = normalize(personName)
  const values = Array.isArray(field.value) ? field.value : [field.value]

  return values.some(value => {
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value) === expectedId || normalize(String(value)) === expectedName
    }

    if (value && typeof value === 'object') {
      const person = value as Record<string, unknown>
      const candidateId = person.id ?? person.userid ?? person.user_id
      const candidateName = person.username ?? person.name ?? person.email
      return (
        (candidateId != null && String(candidateId) === expectedId) ||
        (candidateName != null && normalize(String(candidateName)) === expectedName)
      )
    }

    return false
  })
}

function clickUpHeaders() {
  const token = Deno.env.get('CLICKUP_TOKEN')
  if (!token) throw new Error('CLICKUP_TOKEN não configurado nos secrets do Supabase')
  return { Authorization: token, 'Content-Type': 'application/json' }
}

async function clickUpJson(path: string) {
  const response = await fetch(`${CLICKUP_API}${path}`, { headers: clickUpHeaders() })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`ClickUp ${response.status}: ${body.slice(0, 240)}`)
  }
  return response.json()
}

async function fetchListTasks(listId: string) {
  const all: ClickUpTask[] = []

  for (let page = 0; page < 100; page++) {
    const query = new URLSearchParams({
      archived: 'false',
      include_closed: 'true',
      subtasks: 'false',
      page: String(page),
    })
    const data = await clickUpJson(`/list/${listId}/task?${query}`)
    const tasks: ClickUpTask[] = data.tasks ?? []
    all.push(...tasks)
    if (tasks.length < 100 || data.last_page === true) break
  }

  return all
}

async function fetchFolderTasks(folderId: string) {
  const data = await clickUpJson(`/folder/${folderId}/list?archived=false`)
  const listIds = (data.lists ?? []).map((list: { id: string }) => String(list.id))
  const uniqueTasks = new Map<string, ClickUpTask>()

  // Pequenos lotes evitam disparar dezenas de chamadas simultâneas na API.
  for (let index = 0; index < listIds.length; index += 5) {
    const batch = listIds.slice(index, index + 5)
    const pages = await Promise.all(batch.map(fetchListTasks))
    pages.forEach(tasks => {
      tasks.forEach(task => uniqueTasks.set(String(task.id), task))
    })
  }

  return [...uniqueTasks.values()]
}

function count(tasks: ClickUpTask[], status: string, assigneeId?: string) {
  return tasks.filter(task =>
    statusIs(task, status) && (!assigneeId || hasAssignee(task, assigneeId))
  ).length
}

function countByCustomPerson(
  tasks: ClickUpTask[],
  status: string,
  fieldName: string,
  personId: string,
  personName: string,
) {
  return tasks.filter(task =>
    statusIs(task, status) &&
    customFieldHasPerson(task, fieldName, personId, personName)
  ).length
}

function tasksByCustomPerson(
  tasks: ClickUpTask[],
  status: string,
  fieldName: string,
  personId: string,
  personName: string,
) {
  return tasks
    .filter(task =>
      statusIs(task, status) &&
      customFieldHasPerson(task, fieldName, personId, personName)
    )
    .map(task => ({
      id: task.id,
      nome: task.name ?? '(sem nome)',
      url: task.url ?? null,
      lista: task.list?.name ?? null,
    }))
}

type ClickUpTask = {
  id: string
  name?: string
  url?: string
  date_updated?: string | null
  status?: { status?: string }
  assignees?: Array<{ id: string | number }>
  list?: { id?: string; name?: string }
  custom_fields?: Array<{
    name?: string
    value?: unknown
  }>
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestUrl = new URL(request.url)
    const days = Math.max(1, Math.min(365, Number(requestUrl.searchParams.get('days')) || 30))
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000

    const { data: deliveryHistory, error: historyError } = await supabase
      .from('clickup_delivery_history')
      .select('task_id,task_name,task_url,professional,status_before,status_after,changed_at,changed_by_name,due_at,due_has_time,deadline_result')
      .gte('changed_at', new Date(cutoff).toISOString())
      .order('changed_at', { ascending: false })

    if (historyError) throw historyError

    const deadlineStats = (professional: 'patricia' | 'anna') => {
      const history = (deliveryHistory ?? []).filter(item => item.professional === professional)
      const onTime = history.filter(item => item.deadline_result === 'on_time').length
      const late = history.filter(item => item.deadline_result === 'late').length
      const noDueDate = history.filter(item => item.deadline_result === 'no_due_date').length
      const measured = onTime + late
      return {
        noPrazo: onTime,
        atrasadas: late,
        semPrazo: noDueDate,
        percentualNoPrazo: measured ? Math.round((onTime / measured) * 100) : null,
        historico: history,
      }
    }

    const [designTasks, videoTasks, schedulingTasks, clientTasks] = await Promise.all([
      fetchListTasks(IDS.designList),
      fetchListTasks(IDS.videoList),
      fetchListTasks(IDS.schedulingList),
      fetchFolderTasks(IDS.clientsFolder),
    ])

    const patricia = {
      id: IDS.patricia,
      nome: 'Patrícia',
      funcao: 'Design',
      metricas: {
        paraFazer: count(designTasks, 'Para Fazer'),
        emAprovacao: countByCustomPerson(
          clientTasks, 'Em Aprovação', 'Designer', IDS.patricia, 'Patricia Vannucci',
        ),
        emAlteracao: countByCustomPerson(
          clientTasks, 'Em Alteração', 'Designer', IDS.patricia, 'Patricia Vannucci',
        ),
      },
      prazo: deadlineStats('patricia'),
    }

    const anna = {
      id: IDS.anna,
      nome: 'Anna',
      funcao: 'Edição de Vídeos',
      metricas: {
        paraFazer: count(videoTasks, 'Para Fazer'),
        emAndamento: count(videoTasks, 'Em Andamento'),
        emAprovacao: count(clientTasks, 'Em Aprovação', IDS.anna),
        emAlteracao: count(clientTasks, 'Em Alteração', IDS.anna),
      },
      prazo: deadlineStats('anna'),
    }

    const postadosRecentes = schedulingTasks.filter(task => {
      const updatedAt = Number(task.date_updated ?? 0)
      return statusIs(task, 'Postado') && updatedAt >= cutoff
    }).length

    const bruno = {
      id: 'bruno',
      nome: 'Bruno',
      funcao: 'Agendamentos',
      metricas: {
        paraAgendar: count(schedulingTasks, 'Para Agendar'),
        postado: postadosRecentes,
      },
    }

    return new Response(JSON.stringify({
      periodo_dias: days,
      gerado_em: new Date().toISOString(),
      pessoas: { patricia, anna, bruno },
      fontes: {
        design: IDS.designList,
        video: IDS.videoList,
        agendamentos: IDS.schedulingList,
        clientes: IDS.clientsFolder,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[produtividade]', error)
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Erro inesperado',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
