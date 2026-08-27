import fs from 'fs';

const content = fs.readFileSync('Consulta de Itens - Atas e Contratos - Agosto 3(BASE DE DADOS).csv', 'utf8').catch ? fs.readFileSync('Consulta de Itens - Atas e Contratos - Agosto 3(BASE DE DADOS).csv', 'latin1') : fs.readFileSync('Consulta de Itens - Atas e Contratos - Agosto 3(BASE DE DADOS).csv', 'latin1');

// Let's inspect line by line to find where header is or structure of fields
const lines = content.split(/\r?\n/);

let headerLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].toLowerCase().includes('empresa') || lines[i].toLowerCase().includes('item') || lines[i].toLowerCase().includes('descri')) {
    console.log(`Potential Header at line ${i}: ${lines[i]}`);
  }
}

// Check first 10 rows with > 5 semicolons
let sampleRows = [];
for (let i = 0; i < lines.length; i++) {
  const parts = lines[i].split(';');
  if (parts.length >= 8) {
    sampleRows.push({ line: i, cols: parts.length, parts });
    if (sampleRows.length >= 10) break;
  }
}

fs.writeFileSync('csv_summary.json', JSON.stringify(sampleRows, null, 2));
console.log('Saved csv_summary.json');
