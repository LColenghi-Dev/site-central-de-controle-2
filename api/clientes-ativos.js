import fs from 'node:fs/promises'
import path from 'node:path'
import zlib from 'node:zlib'

const FALLBACK_COUNT = 16

function readUInt16(buffer, offset) {
  return buffer.readUInt16LE(offset)
}

function readUInt32(buffer, offset) {
  return buffer.readUInt32LE(offset)
}

function findEndOfCentralDirectory(buffer) {
  for (let i = buffer.length - 22; i >= 0; i -= 1) {
    if (readUInt32(buffer, i) === 0x06054b50) return i
  }
  return -1
}

function unzipEntries(buffer) {
  const eocdOffset = findEndOfCentralDirectory(buffer)
  if (eocdOffset < 0) throw new Error('Invalid XLSX zip structure')

  const totalEntries = readUInt16(buffer, eocdOffset + 10)
  const centralDirOffset = readUInt32(buffer, eocdOffset + 16)
  const entries = new Map()
  let cursor = centralDirOffset

  for (let i = 0; i < totalEntries; i += 1) {
    if (readUInt32(buffer, cursor) !== 0x02014b50) break

    const compression = readUInt16(buffer, cursor + 10)
    const compressedSize = readUInt32(buffer, cursor + 20)
    const fileNameLength = readUInt16(buffer, cursor + 28)
    const extraLength = readUInt16(buffer, cursor + 30)
    const commentLength = readUInt16(buffer, cursor + 32)
    const localHeaderOffset = readUInt32(buffer, cursor + 42)
    const fileName = buffer
      .subarray(cursor + 46, cursor + 46 + fileNameLength)
      .toString('utf8')

    const localNameLength = readUInt16(buffer, localHeaderOffset + 26)
    const localExtraLength = readUInt16(buffer, localHeaderOffset + 28)
    const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength
    const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize)

    let data
    if (compression === 0) data = compressed
    else if (compression === 8) data = zlib.inflateRawSync(compressed)
    else throw new Error(`Unsupported XLSX compression method: ${compression}`)

    entries.set(fileName, data.toString('utf8'))
    cursor += 46 + fileNameLength + extraLength + commentLength
  }

  return entries
}

function decodeXml(text) {
  return String(text ?? '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

function getSharedStrings(entries) {
  const xml = entries.get('xl/sharedStrings.xml')
  if (!xml) return []

  return [...xml.matchAll(/<si\b[\s\S]*?<\/si>/g)].map(([item]) => {
    const parts = [...item.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((match) => decodeXml(match[1]))
    return parts.join('')
  })
}

function columnName(cellRef) {
  return cellRef.replace(/\d+/g, '')
}

function getAttribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}="([^"]+)"`))?.[1]
}

function parseRows(sheetXml, sharedStrings) {
  return [...sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map(([, rowXml]) => {
    const row = {}

    for (const [, cellTag, cellXml] of rowXml.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const ref = getAttribute(cellTag, 'r')
      const type = getAttribute(cellTag, 't')
      if (!ref) continue

      const valueMatch = cellXml.match(/<v>([\s\S]*?)<\/v>/)
      const inlineMatch = cellXml.match(/<t[^>]*>([\s\S]*?)<\/t>/)
      let value = ''

      if (type === 's' && valueMatch) {
        value = sharedStrings[Number(valueMatch[1])] ?? ''
      } else if (inlineMatch) {
        value = decodeXml(inlineMatch[1])
      } else if (valueMatch) {
        value = decodeXml(valueMatch[1])
      }

      row[columnName(ref)] = String(value).trim()
    }

    return row
  })
}

function normalize(value) {
  return String(value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function countActiveClientsFromXlsx(buffer) {
  const entries = unzipEntries(buffer)
  const sharedStrings = getSharedStrings(entries)
  const sheetXml = entries.get('xl/worksheets/sheet1.xml')
  if (!sheetXml) throw new Error('First worksheet not found')

  const rows = parseRows(sheetXml, sharedStrings)
  const headerIndex = rows.findIndex((row) => {
    const values = Object.values(row).map(normalize)
    return values.includes('cliente') && values.includes('status')
  })
  if (headerIndex < 0) throw new Error('Cliente header not found')

  const headerRow = rows[headerIndex]
  const clienteCol = Object.entries(headerRow).find(([, value]) => normalize(value) === 'cliente')?.[0]
  const statusCol = Object.entries(headerRow).find(([, value]) => normalize(value) === 'status')?.[0]
  if (!clienteCol || !statusCol) throw new Error('Cliente or Status column not found')

  return rows.slice(headerIndex + 1).filter((row) => {
    return row[clienteCol] && normalize(row[statusCol]) === 'ativo'
  }).length
}

export default async function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'clientes.xlsx')
    const buffer = await fs.readFile(filePath)
    const activeClients = countActiveClientsFromXlsx(buffer)

    res
      .status(200)
      .setHeader('Cache-Control', 'no-store')
      .json({ activeClients })
  } catch (err) {
    res
      .status(200)
      .setHeader('Cache-Control', 'no-store')
      .json({ activeClients: FALLBACK_COUNT, fallback: true, message: err.message })
  }
}
