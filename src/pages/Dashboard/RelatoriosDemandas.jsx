import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Plus, X, FileText, Calendar, ChevronDown, ChevronUp,
  Search, Upload, File, FileImage, Paperclip, ChevronRight, Download,
} from 'lucide-react'
import { loadRelatorios, createRelatorio, deleteRelatorio, loadUsuarios, getAnexoUrl } from '../../lib/api'

const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3 MB por arquivo

/* ── helpers ────────────────────────────────────────────── */
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

/* ── Área de upload ─────────────────────────────────────── */
function UploadArea({ arquivos, onChange }) {
  const inputRef = useRef(null)
  const [drag, setDrag] = useState(false)

  async function processFiles(fileList) {
    const novos = []
    for (const file of Array.from(fileList)) {
      if (file.size > MAX_FILE_SIZE) {
        alert(`"${file.name}" excede 3 MB e não foi adicionado.`)
        continue
      }
      novos.push({ name: file.name, size: file.size, type: file.type, rawFile: file })
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
  const [usuarios, setUsuarios] = useState([])
  const [saving,   setSaving]   = useState(false)
  const [form, setForm] = useState({
    titulo: '', responsavel: '', semana: '', conteudo: '', arquivos: [],
  })
  const [errors, setErrors] = useState({})

  useEffect(() => { loadUsuarios().then(setUsuarios) }, [])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.titulo.trim())   e.titulo      = 'Campo obrigatório'
    if (!form.responsavel)     e.responsavel = 'Selecione um responsável'
    if (!form.semana.trim())   e.semana      = 'Campo obrigatório'
    if (!form.conteudo.trim()) e.conteudo    = 'Campo obrigatório'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      await onSave({ ...form, criadoEm: new Date().toISOString() })
    } finally {
      setSaving(false)
    }
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

          <UploadArea
            arquivos={form.arquivos}
            onChange={files => setForm(f => ({ ...f, arquivos: files }))}
          />

          <div className="rd-modal__footer">
            <button type="button" className="rd-btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="rd-btn-primary" disabled={saving}>
              <Plus size={15} />
              {saving ? 'Salvando...' : 'Salvar Relatório'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

/* ── Anexo individual (suporta Storage e base64 legado) ── */
function AnexoItem({ arquivo }) {
  const [url, setUrl] = useState(arquivo.data ?? null)
  const Icon = fileIcon(arquivo.type)

  useEffect(() => {
    if (!arquivo.data && arquivo.path) {
      getAnexoUrl(arquivo.path).then(setUrl).catch(() => setUrl(null))
    }
  }, [arquivo])

  if (!url) return (
    <div className="rd-attach-item">
      <Icon size={13} className="rd-attach-item__icon" />
      <span className="rd-attach-item__name">{arquivo.name}</span>
      <span className="rd-attach-item__size">{fmtSize(arquivo.size)}</span>
    </div>
  )

  return (
    <a href={url} download={arquivo.name} className="rd-attach-item" title={`Baixar ${arquivo.name}`}>
      <Icon size={13} className="rd-attach-item__icon" />
      <span className="rd-attach-item__name">{arquivo.name}</span>
      <span className="rd-attach-item__size">{fmtSize(arquivo.size)}</span>
    </a>
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

      {relatorio.arquivos?.length > 0 && (
        <div className="rd-card__attachments">
          <p className="rd-card__attach-label">
            <Paperclip size={11} /> {relatorio.arquivos.length} anexo{relatorio.arquivos.length !== 1 ? 's' : ''}
          </p>
          <div className="rd-attach-list">
            {relatorio.arquivos.map((f, i) => (
              <AnexoItem key={i} arquivo={f} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Export CSV ─────────────────────────────────────── */
function exportCSV(lista) {
  if (lista.length === 0) { alert('Nenhum relatório para exportar.'); return }

  const escape = v => `"${String(v ?? '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
  const header = ['Título', 'Responsável', 'Semana', 'Data de criação', 'Conteúdo', 'Anexos']
  const rows = lista.map(r => [
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
  const [relatorios, setRelatorios] = useState([])
  const [showModal,  setShowModal]  = useState(false)
  const [filtro,     setFiltro]     = useState('todos')
  const [busca,      setBusca]      = useState('')

  useEffect(() => {
    loadRelatorios().then(setRelatorios)
  }, [])

  async function handleSave(novo) {
    const saved = await createRelatorio(novo)
    setRelatorios(prev => [saved, ...prev])
    setShowModal(false)
  }

  async function handleDelete(id) {
    await deleteRelatorio(id)
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

  return (
    <div className="rd">

      <div className="rd-header">
        <div>
          <p className="cc-eyebrow">Gestão de Demandas</p>
          <h2 className="cc-title">Relatórios Semanais</h2>
        </div>
        <div className="rd-header-actions">
          {relatorios.length > 0 && (
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

      {showModal && createPortal(
        <NovoRelatorioModal onClose={() => setShowModal(false)} onSave={handleSave} />,
        document.body
      )}
    </div>
  )
}
