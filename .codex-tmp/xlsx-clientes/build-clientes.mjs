import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "C:/Users/User/site-central-de-controle-2/outputs";
const workbook = Workbook.create();
const sheet = workbook.worksheets.add("Clientes");
sheet.showGridLines = false;

sheet.getRange("A1:E1").merge();
sheet.getRange("A1").values = [["Lista de Clientes"]];
sheet.getRange("A2:E2").merge();
sheet.getRange("A2").values = [["Preencha 1 cliente por linha. O site conta somente linhas com Cliente preenchido e Status = Ativo."]];

sheet.getRange("A4:E4").merge();
sheet.getRange("A4").values = [["Legenda"]];
sheet.getRange("A5:E8").values = [
  ["Campo", "Como preencher", "", "", ""],
  ["Cliente", "Nome da empresa ou pessoa. Campo obrigatorio.", "", "", ""],
  ["Status", "Escolha Ativo ou Inativo.", "", "", ""],
  ["Observacoes", "Campo livre para contexto, contrato ou aviso.", "", "", ""],
];

sheet.getRange("A11:E11").values = [["Cliente", "Status", "Segmento", "Entrada", "Observacoes"]];
sheet.getRange("A12:E211").values = Array.from({ length: 200 }, (_, index) => {
  if (index === 0) return ["Mar Azul Agencia Digital", "Ativo", "Marketing", new Date("2026-01-10"), "Exemplo: substitua pelos seus clientes reais."];
  if (index === 1) return ["Cliente Exemplo 02", "Ativo", "E-commerce", new Date("2026-02-01"), ""];
  if (index === 2) return ["Cliente Exemplo 03", "Ativo", "Servicos", new Date("2026-03-15"), ""];
  if (index === 3) return ["Cliente Exemplo 04", "Inativo", "Saude", new Date("2025-11-22"), "Mantido para historico."];
  return [null, null, null, null, null];
});

const table = sheet.tables.add("A11:E211", true, "ListaClientes");
table.style = "TableStyleMedium2";
table.showFilterButton = true;

sheet.freezePanes.freezeRows(11);
sheet.getRange("B12:B211").dataValidation = { rule: { type: "list", values: ["Ativo", "Inativo"] } };

sheet.getRange("A1:E1").format = {
  fill: "#0B3B5A",
  font: { bold: true, color: "#FFFFFF", size: 22 },
  horizontalAlignment: "center",
  verticalAlignment: "center",
};
sheet.getRange("A2:E2").format = {
  fill: "#EAF2F8",
  font: { color: "#365366", size: 11 },
  horizontalAlignment: "center",
};
sheet.getRange("A4:E4").format = {
  fill: "#18A999",
  font: { bold: true, color: "#FFFFFF", size: 14 },
  horizontalAlignment: "center",
};
sheet.getRange("A5:B8").format = {
  fill: "#F8FAFC",
  borders: { preset: "all", style: "thin", color: "#D6DEE8" },
};
sheet.getRange("A5:B5").format = {
  fill: "#0B3B5A",
  font: { bold: true, color: "#FFFFFF" },
};
sheet.getRange("A11:E11").format = {
  fill: "#0B3B5A",
  font: { bold: true, color: "#FFFFFF" },
  horizontalAlignment: "center",
};
sheet.getRange("A12:E211").format.borders = {
  insideHorizontal: { style: "thin", color: "#E3EAF2" },
  insideVertical: { style: "thin", color: "#E3EAF2" },
};
sheet.getRange("D12:D211").setNumberFormat("yyyy-mm-dd");
sheet.getRange("E12:E211").format.wrapText = true;

sheet.getRange("B12:B211").conditionalFormats.add("containsText", {
  text: "Ativo",
  format: { fill: "#E7F7EF", font: { color: "#0F7A45", bold: true } },
});
sheet.getRange("B12:B211").conditionalFormats.add("containsText", {
  text: "Inativo",
  format: { fill: "#FDECEC", font: { color: "#B42318", bold: true } },
});

sheet.getRange("A1:E1").format.rowHeight = 36;
sheet.getRange("A2:E2").format.rowHeight = 24;
sheet.getRange("A4:E4").format.rowHeight = 24;
sheet.getRange("A:A").format.columnWidth = 30;
sheet.getRange("B:B").format.columnWidth = 14;
sheet.getRange("C:C").format.columnWidth = 20;
sheet.getRange("D:D").format.columnWidth = 13;
sheet.getRange("E:E").format.columnWidth = 55;
sheet.getRange("B5:B8").format.columnWidth = 36;
sheet.getRange("A6:B8").format.rowHeight = 30;
sheet.getRange("A5:E8").format.wrapText = true;

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "formula error scan",
});
console.log(errors.ndjson);

const inspect = await workbook.inspect({
  kind: "table",
  range: "Clientes!A1:E24",
  include: "values,formulas",
  tableMaxRows: 24,
  tableMaxCols: 5,
});
console.log(inspect.ndjson);

const preview = await workbook.render({ sheetName: "Clientes", range: "A1:E24", scale: 1, format: "png" });
await fs.writeFile(`${outputDir}/clientes_ativos_lista_preview.png`, new Uint8Array(await preview.arrayBuffer()));

await fs.mkdir(outputDir, { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(`${outputDir}/clientes_ativos_lista_modelo.xlsx`);
