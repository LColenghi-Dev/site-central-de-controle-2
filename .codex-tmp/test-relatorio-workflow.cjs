const fs = require('fs')

const workflow = JSON.parse(fs.readFileSync('automacoes-n8n/relatorio-email.workflow.json', 'utf8'))
const node = workflow.nodes.find(n => n.name === 'Formatar Email Gmail')
let code = node.parameters.jsCode.replace('EMAIL_DA_CHEFE_AQUI@dominio.com', 'chefe@empresa.com')

const payload = {
  body: {
    titulo: 'TESTE3',
    responsavel: 'Luis Felipe',
    responsavelEmail: 'luisfelipe@agencia.com',
    semana: '29/06/2026 - 03/07/2026',
    conteudo: 'Linha 1\nLinha 2 <script>',
    arquivos: [
      { name: 'briefing.pdf', url: 'https://example.com/briefing.pdf' },
    ],
  },
}

const result = new Function('$input', code)({
  first: () => ({ json: payload }),
})

console.log(JSON.stringify({
  to: result[0].json.to,
  replyTo: result[0].json.replyTo,
  subject: result[0].json.subject,
  hasEscapedHtml: result[0].json.html.includes('Linha 1<br>Linha 2 &lt;script&gt;'),
  hasAttachment: result[0].json.html.includes('briefing.pdf'),
  outputKeys: Object.keys(result[0].json),
}, null, 2))
