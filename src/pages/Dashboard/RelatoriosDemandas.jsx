import { useState, useEffect, useRef } from 'react'
import {
  Plus, X, FileText, Calendar, ChevronDown, ChevronUp,
  Search, Upload, File, FileImage, Paperclip, ChevronRight, Download,
} from 'lucide-react'

const STORAGE_KEY   = 'rd_relatorios'
const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3 MB por arquivo

function loadUsuarios() {
  try { return JSON.parse(localStorage.getItem('cfg_usuarios') ?? '[]') } catch { return [] }
}

const DEMO = [
  {
    id: 'demo-1',
    _demo: true,
    titulo: 'Relatório Semana 23 — Design & Criativos',
    responsavel: 'João Silva',
    semana: '02/06 – 08/06/2025',
    conteudo: `Demandas concluídas:\n• Criação de 4 artes para campanha de inverno (Meta Ads)\n• Revisão do banner principal do site\n• Identidade visual do novo produto finalizada\n\nEm andamento:\n• Pack de stories para semana 24 (50% concluído)\n• Adaptação das artes para Google Display\n\nPendências:\n• Aprovação do cliente nas peças de vídeo\n• Briefing da campanha de Dia dos Pais ainda não recebido\n\nObservações:\nSemana com alta demanda de revisões. Recomendo alinhar prazo de aprovação com o cliente para a próxima semana.`,
    arquivos: [],
    criadoEm: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

/* ── helpers ────────────────────────────────────────────── */
function loadRelatorios() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEMO
    const parsed = JSON.parse(stored)
    return parsed.length > 0 ? parsed : DEMO
  } catch { return DEMO }
}
function saveRelatorios(list) {
  const real = list.filter(r => !r._demo)
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(real)) } catch { /* quota */ }
}
function initials(name) {
  return name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
function fileIcon(type) {
  if (type.startsWith('image/')) return FileImage
  return File
}
function readAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/* ── Área de upload ─────────────────────────────────────── */
function UploadArea({ arquivos, onChange }) {
  const inputRef  = useRef(null)
  const [drag, setDrag] = useState(false)

  async function processFiles(fileList) {
    const novos = []
    for (const file of Array.from(fileList)) {
      if (file.size > MAX_FILE_SIZE) {
        alert(`"${file.name}" excede 3 MB e não foi adicionado.`)
        continue
      }
      const data = await readAsBase64(file)
      novos.push({ name: file.name, size: file.size, type: file.type, data })
    }
    onChange([...arquivos, ...novos])
  }

  function onDrop(e) {
    e.preventDefault()
    setDrag(false)
    processFiles(e.dataTransfer.files)
  }

  function removeFile(idx) {
    onChange(arquivos.filter((_, i) => i !== idx))
  }

  return (
    <div className="rd-field">
      <label className="rd-label">
        <Paperclip size={11} style={{ marginRight: 5, verticalAlign: 'middle' }} />
        Documentos anexos
      </label>

      {/* Zona de drop */}
      <div
        className={`rd-upload${drag ? ' rd-upload--drag' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
      >
        <Upload size={20} className="rd-upload__icon" />
        <p className="rd-upload__text">
          Arraste arquivos ou <span>clique para selecionar</span>
        </p>
        <p className="rd-upload__hint">PDF, Word, Excel, imagens · máx. 3 MB por arquivo</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp"
          onChange={e => processFiles(e.target.files)}
        />
      </div>

      {/* Lista de arquivos adicionados */}
      {arquivos.length > 0 && (
        <div className="rd-file-list">
          {arquivos.map((f, i) => {
            const Icon = fileIcon(f.type)
            return (
              <div key={i} className="rd-file-item">
                <Icon size={14} className="rd-file-item__icon" />
                <span className="rd-file-item__name">{f.name}</span>
                <span className="rd-file-item__size">{fmtSize(f.size)}</span>
                <button
                  type="button"
                  className="rd-file-item__remove"
                  onClick={() => removeFile(i)}
                  aria-label="Remover"
                >
                  <X size={11} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Modal de criação ─────────────────────────────────── */
function NovoRelatorioModal({ onClose, onSave }) {
  const usuarios = loadUsuarios()
  const [form, setForm] = useState({
    titulo: '', responsavel: '', semana: '', conteudo: '', arquivos: [],
  })
  const [errors, setErrors] = useState({})

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.titulo.trim())       e.titulo      = 'Campo obrigatório'
    if (!form.responsavel)         e.responsavel = 'Selecione um responsável'
    if (!form.semana.trim())       e.semana      = 'Campo obrigatório'
    if (!form.conteudo.trim())     e.conteudo    = 'Campo obrigatório'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    onSave({ id: crypto.randomUUID(), ...form, criadoEm: new Date().toISOString() })
  }

  return (
    <div className="rd-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="rd-modal">

        <div className="rd-modal__header">
          <div className="rd-modal__title-wrap">
            <div className="rd-modal__icon"><FileText size={18} /></div>
            <div>
              <p className="rd-modal__eyebrow">Novo Documento</p>
              <h3 className="rd-modal__title">Relatório de Demandas</h3>
            </div>
          </div>
          <button className="rd-modal__close" onClick={onClose} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        <form className="rd-modal__body" onSubmit={handleSubmit} noValidate>

          {/* Linha: título + responsável */}
          <div className="rd-field-row">
            <div className="rd-field">
              <label className="rd-label">Título do relatório</label>
              <input
                className={`rd-input${errors.titulo ? ' rd-input--error' : ''}`}
                placeholder="Ex: Relatório Semana 23 — Design"
                value={form.titulo}
                onChange={e => set('titulo', e.target.value)}
              />
              {errors.titulo && <span className="rd-error">{errors.titulo}</span>}
            </div>

            <div className="rd-field">
              <label className="rd-label">Responsável</label>
              <div className="rd-select-wrap">
                <select
                  className={`rd-select${errors.responsavel ? ' rd-input--error' : ''}`}
                  value={form.responsavel}
                  onChange={e => set('responsavel', e.target.value)}
                >
                  <option value="">Selecionar responsável...</option>
                  {usuarios.map(u => (
                    <option key={u.id} value={u.nome}>{u.nome}{u.cargo ? ` — ${u.cargo}` : ''}</option>
                  ))}
                </select>
                <ChevronRight size={13} className="rd-select-arrow" />
              </div>
              {errors.responsavel && <span className="rd-error">{errors.responsavel}</span>}
            </div>
          </div>

          {/* Período */}
          <div className="rd-field">
            <label className="rd-label">Período / Semana</label>
            <div className="rd-input-wrap">
              <Calendar size={14} className="rd-input-icon" />
              <input
                className={`rd-input rd-input--icon${errors.semana ? ' rd-input--error' : ''}`}
                placeholder="Ex: 09/06 – 15/06/2025"
                value={form.semana}
                onChange={e => set('semana', e.target.value)}
              />
            </div>
            {errors.semana && <span className="rd-error">{errors.semana}</span>}
          </div>

          {/* Conteúdo */}
          <div className="rd-field">
            <label className="rd-label">Conteúdo do relatório</label>
            <textarea
              className={`rd-textarea${errors.conteudo ? ' rd-input--error' : ''}`}
              placeholder="Descreva as demandas, entregas, pendências e observações da semana..."
              value={form.conteudo}
              onChange={e => set('conteudo', e.target.value)}
              rows={5}
            />
            {errors.conteudo && <span className="rd-error">{errors.conteudo}</span>}
          </div>

          {/* Upload */}
          <UploadArea
            arquivos={form.arquivos}
            onChange={files => setForm(f => ({ ...f, arquivos: files }))}
          />

          <div className="rd-modal__footer">
            <button type="button" className="rd-btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="rd-btn-primary">
              <Plus size={15} />
              Salvar Relatório
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

/* ── Card de relatório ───────────────────────────────── */
function RelatorioCard({ relatorio, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const preview = relatorio.conteudo.slice(0, 180)
  const hasMore = relatorio.conteudo.length > 180

  return (
    <div className="rd-card">
      <div className="rd-card__header">
        <div className="rd-card__author">
          <div className="rd-avatar">{initials(relatorio.responsavel)}</div>
          <div>
            <p className="rd-card__name">{relatorio.responsavel}</p>
            <p className="rd-card__date">{formatDate(relatorio.criadoEm)}</p>
          </div>
        </div>
        <div className="rd-card__badges">
          <span className="rd-badge rd-badge--cyan">{relatorio.semana}</span>
          <button
            className="rd-card__delete"
            onClick={() => onDelete(relatorio.id)}
            aria-label="Excluir"
            title="Excluir relatório"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      <h4 className="rd-card__title">{relatorio.titulo}</h4>

      <p className="rd-card__preview">
        {expanded ? relatorio.conteudo : preview}
        {!expanded && hasMore && '…'}
      </p>

      {hasMore && (
        <button className="rd-card__expand" onClick={() => setExpanded(v => !v)}>
          {expanded ? <><ChevronUp size={13} /> Ver menos</> : <><ChevronDown size={13} /> Ver mais</>}
        </button>
      )}

      {/* Anexos */}
      {relatorio.arquivos?.length > 0 && (
        <div className="rd-card__attachments">
          <p className="rd-card__attach-label">
            <Paperclip size={11} /> {relatorio.arquivos.length} anexo{relatorio.arquivos.length !== 1 ? 's' : ''}
          </p>
          <div className="rd-attach-list">
            {relatorio.arquivos.map((f, i) => {
              const Icon = fileIcon(f.type)
              return (
                <a
                  key={i}
                  href={f.data}
                  download={f.name}
                  className="rd-attach-item"
                  title={`Baixar ${f.name}`}
                >
                  <Icon size={13} className="rd-attach-item__icon" />
                  <span className="rd-attach-item__name">{f.name}</span>
                  <span className="rd-attach-item__size">{fmtSize(f.size)}</span>
                </a>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Export CSV ─────────────────────────────────────── */
function exportCSV(lista) {
  const reais = lista.filter(r => !r._demo)
  if (reais.length === 0) { alert('Nenhum relatório real para exportar.'); return }

  const escape = v => `"${String(v ?? '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
  const header = ['Título', 'Responsável', 'Semana', 'Data de criação', 'Conteúdo', 'Anexos']
  const rows = reais.map(r => [
    r.titulo,
    r.responsavel,
    r.semana,
    new Date(r.criadoEm).toLocaleDateString('pt-BR'),
    r.conteudo,
    (r.arquivos ?? []).map(a => a.name).join('; '),
  ])

  const csv = [header, ...rows].map(row => row.map(escape).join(',')).join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), {
    href: url,
    download: `relatorios-demandas-${new Date().toISOString().slice(0, 10)}.csv`,
  })
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/* ── Componente principal ────────────────────────────── */
export default function RelatoriosDemandas() {
  const [relatorios, setRelatorios] = useState(loadRelatorios)
  const [showModal,  setShowModal]  = useState(false)
  const [filtro,     setFiltro]     = useState('todos')
  const [busca,      setBusca]      = useState('')

  useEffect(() => { saveRelatorios(relatorios) }, [relatorios])

  function handleSave(novo) {
    setRelatorios(prev => [novo, ...prev])
    setShowModal(false)
  }

  function handleDelete(id) {
    setRelatorios(prev => prev.filter(r => r.id !== id))
  }

  const responsaveis = ['todos', ...Array.from(new Set(relatorios.map(r => r.responsavel))).sort()]

  const filtrados = relatorios.filter(r => {
    const matchFiltro = filtro === 'todos' || r.responsavel === filtro
    const matchBusca  = busca === '' ||
      r.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      r.responsavel.toLowerCase().includes(busca.toLowerCase()) ||
      r.conteudo.toLowerCase().includes(busca.toLowerCase())
    return matchFiltro && matchBusca
  })

  const temReais = relatorios.some(r => !r._demo)

  return (
    <div className="rd">

      <div className="rd-header">
        <div>
          <p className="cc-eyebrow">Gestão de Demandas</p>
          <h2 className="cc-title">Relatórios Semanais</h2>
        </div>
        <div className="rd-header-actions">
          {temReais && (
            <button className="rd-btn-ghost" onClick={() => exportCSV(relatorios)}>
              <Download size={15} /> Exportar CSV
            </button>
          )}
          <button className="rd-btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Novo Relatório
          </button>
        </div>
      </div>

      <div className="rd-filters">
        <div className="rd-search-wrap">
          <Search size={14} className="rd-search-icon" />
          <input
            className="rd-search"
            placeholder="Buscar relatório..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        <div className="rd-filter-tabs">
          {responsaveis.map(resp => (
            <button
              key={resp}
              className={`rd-filter-tab${filtro === resp ? ' rd-filter-tab--active' : ''}`}
              onClick={() => setFiltro(resp)}
            >
              {resp === 'todos' ? 'Todos' : resp}
            </button>
          ))}
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="rd-empty">
          <div className="rd-empty__icon"><FileText size={28} /></div>
          <p className="rd-empty__title">
            {relatorios.length === 0 ? 'Nenhum relatório ainda' : 'Nenhum resultado encontrado'}
          </p>
          <p className="rd-empty__sub">
            {relatorios.length === 0
              ? 'Clique em "Novo Relatório" para adicionar o primeiro.'
              : 'Tente ajustar o filtro ou a busca.'}
          </p>
          {relatorios.length === 0 && (
            <button className="rd-btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={15} /> Criar primeiro relatório
            </button>
          )}
        </div>
      ) : (
        <div className="rd-list">
          {filtrados.map(r => (
            <RelatorioCard key={r.id} relatorio={r} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showModal && (
        <NovoRelatorioModal onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
    </div>
  )
}
