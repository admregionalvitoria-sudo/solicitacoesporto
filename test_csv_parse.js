import fs from 'fs';

export function parseSenaiItemsFromCSV(bufferOrString) {
  let content = '';
  if (Buffer.isBuffer(bufferOrString)) {
    content = bufferOrString.toString('latin1');
  } else {
    content = String(bufferOrString);
  }

  const lines = content.split(/\r?\n/);
  const items = [];

  let headerIdx = -1;
  let colEntidade = 3;
  let colCodigo = 1;
  let colContrato = 2;
  let colFornecedor = 5;
  let colNome = 9;
  let colDesc = 10;

  for (let i = 0; i < Math.min(20, lines.length); i++) {
    const parts = lines[i].split(';').map(p => p.trim().replace(/^"+|"+$/g, ''));
    const entIndex = parts.findIndex(p => p.toUpperCase().includes('ENTIDADE'));
    if (entIndex !== -1) {
      headerIdx = i;
      colEntidade = entIndex;
      const cod = parts.findIndex(p => p.toUpperCase().includes('COD. PRODUTO') || p.toUpperCase().includes('CÓDIGO'));
      if (cod !== -1) colCodigo = cod;
      const cont = parts.findIndex(p => p.toUpperCase().includes('CONTRATO'));
      if (cont !== -1) colContrato = cont;
      const forn = parts.findIndex(p => p.toUpperCase().includes('FORNECEDOR'));
      if (forn !== -1) colFornecedor = forn;
      const nom = parts.findIndex(p => p.toUpperCase().includes('NOME FANTASIA'));
      if (nom !== -1) colNome = nom;
      const desc = parts.findIndex(p => p.toUpperCase().includes('DESC. PRODUTO') || p.toUpperCase().includes('DESCRIÇÃO'));
      if (desc !== -1) colDesc = desc;
      break;
    }
  }

  const startRow = headerIdx !== -1 ? headerIdx + 1 : 0;

  for (let i = startRow; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = lines[i].split(';').map(p => p.trim().replace(/^"+|"+$/g, ''));

    const entidade = (parts[colEntidade] || '').toUpperCase();
    if (entidade.includes('SENAI')) {
      const codigo = parts[colCodigo] || '';
      const contrato = parts[colContrato] || '';
      const fornecedor = parts[colFornecedor] || '';
      const nomeFantasia = parts[colNome] || '';
      const descricao = parts[colDesc] || nomeFantasia;

      const itemText = (descricao || nomeFantasia).trim();
      if (!itemText) continue;

      const fullName = codigo ? `[${codigo}] ${itemText}` : itemText;

      items.push({
        id: codigo || `item_${items.length + 1}`,
        codigo,
        contrato,
        entidade: parts[colEntidade] || 'SENAI',
        fornecedor,
        nome_fantasia: nomeFantasia,
        descricao: itemText,
        full_name: fullName
      });
    }
  }

  // Deduplicate by full_name
  const uniqueMap = new Map();
  items.forEach(it => {
    if (!uniqueMap.has(it.full_name)) {
      uniqueMap.set(it.full_name, it);
    }
  });

  return Array.from(uniqueMap.values());
}

const buffer = fs.readFileSync('Consulta de Itens - Atas e Contratos - Agosto 3(BASE DE DADOS).csv');
const res = parseSenaiItemsFromCSV(buffer);
console.log('Total unique SENAI items:', res.length);
console.log('Sample item 0:', res[0]);
console.log('Sample item 10:', res[10]);
