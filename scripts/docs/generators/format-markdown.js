function escapeMarkdownTableCell(value) {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ');
}

function createMarkdownTable(headers, rows) {
  const header = `| ${headers.join(' | ')} |`;
  const separator = `| ${headers.map(() => '---').join(' | ')} |`;

  const body = rows.map(
    (row) =>
      `| ${row.map(escapeMarkdownTableCell).join(' | ')} |`,
  );

  return [header, separator, ...body].join('\n');
}

module.exports = {
  createMarkdownTable,
  escapeMarkdownTableCell,
};
