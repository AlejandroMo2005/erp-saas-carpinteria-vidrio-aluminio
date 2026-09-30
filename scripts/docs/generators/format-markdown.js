function escapeMarkdown(value) {
  return String(value)
    .replaceAll('\\', '\\\\')
    .replaceAll('|', '\\|')
    .replaceAll('\r\n', '\n')
    .replaceAll('\r', '\n');
}

function formatTableRow(values) {
  return `| ${values
    .map((value) => escapeMarkdown(value))
    .join(' | ')} |`;
}

function formatTable(headers, rows = []) {
  const headerRow = formatTableRow(headers);
  const separatorRow = formatTableRow(
    headers.map(() => '---'),
  );

  const dataRows = rows.map((row) =>
    formatTableRow(row),
  );

  return [
    headerRow,
    separatorRow,
    ...dataRows,
  ].join('\n');
}

function formatList(items = []) {
  if (items.length === 0) {
    return '';
  }

  return items
    .map((item) => `- ${escapeMarkdown(item)}`)
    .join('\n');
}

function formatCode(value) {
  return `\`${String(value).replaceAll('`', '\\`')}\``;
}

module.exports = {
  escapeMarkdown,
  formatTableRow,
  formatTable,
  formatList,
  formatCode,
};
