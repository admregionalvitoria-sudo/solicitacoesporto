import fs from 'fs';

const content = fs.readFileSync('Consulta de Itens - Atas e Contratos - Agosto 3(BASE DE DADOS).csv', 'latin1');

// Split lines properly (note CSV could have quoted multiline strings, but let's check delimiter ;)
const lines = content.split(/\r?\n/);

console.log('--- SAMPLE NON-EMPTY LINES ---');
let count = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(';') && lines[i].split(';').length > 5) {
    console.log(`[Line ${i}] columns: ${lines[i].split(';').length}`);
    console.log(`Content:`, lines[i]);
    count++;
    if (count > 5) break;
  }
}

// Find distinct entities in column 3 (index 3 or similar)
const entities = new Set();
lines.forEach((l) => {
  const parts = l.split(';');
  if (parts.length > 3) {
    const ent = parts[3]?.trim();
    if (ent && ent.length > 1) entities.add(ent);
  }
});

console.log('--- DISTINCT ENTITIES FOUND ---');
console.log(Array.from(entities).slice(0, 30));
