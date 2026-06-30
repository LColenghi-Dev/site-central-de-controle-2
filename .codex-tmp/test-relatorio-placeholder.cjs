const fs = require('fs')

const workflow = JSON.parse(fs.readFileSync('automacoes-n8n/relatorio-email.workflow.json', 'utf8'))
const code = workflow.nodes.find(n => n.name === 'Formatar Email Gmail').parameters.jsCode

try {
  new Function('$input', code)({
    first: () => ({ json: { body: { titulo: 'Teste' } } }),
  })
} catch (error) {
  console.log(error.message)
}
