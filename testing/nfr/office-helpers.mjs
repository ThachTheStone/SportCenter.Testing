import { deflateRawSync, inflateRawSync } from 'node:zlib';
export const escape = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
const xml = body => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + body;
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function zip(parts) {
  const records = [];
  const central = [];
  let offset = 0;
  for (const [name, content] of Object.entries(parts)) {
    const file = Buffer.from(name, 'utf8');
    const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
    const packed = deflateRawSync(bytes);
    const crc = crc32(bytes);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50);
    local.writeUInt16LE(20, 4); local.writeUInt16LE(0x800, 6); local.writeUInt16LE(8, 8); local.writeUInt16LE(33, 12);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(packed.length, 18); local.writeUInt32LE(bytes.length, 22); local.writeUInt16LE(file.length, 26);
    records.push(local, file, packed);
    const dir = Buffer.alloc(46);
    dir.writeUInt32LE(0x02014b50); dir.writeUInt16LE(20, 4); dir.writeUInt16LE(20, 6); dir.writeUInt16LE(0x800, 8); dir.writeUInt16LE(8, 10); dir.writeUInt16LE(33, 14);
    dir.writeUInt32LE(crc, 16); dir.writeUInt32LE(packed.length, 20); dir.writeUInt32LE(bytes.length, 24); dir.writeUInt16LE(file.length, 28); dir.writeUInt32LE(offset, 42);
    central.push(dir, file);
    offset += local.length + file.length + packed.length;
  }
  const dir = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(Object.keys(parts).length, 8); end.writeUInt16LE(Object.keys(parts).length, 10);
  end.writeUInt32LE(dir.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...records, dir, end]);
}
function unzip(bytes) {
  let end = bytes.length - 22;
  while (end >= 0 && bytes.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0) throw new Error('Missing ZIP directory');
  let at = bytes.readUInt32LE(end + 16);
  const count = bytes.readUInt16LE(end + 10);
  const parts = {};
  for (let i = 0; i < count; i++) {
    if (bytes.readUInt32LE(at) !== 0x02014b50) throw new Error('Invalid ZIP directory');
    const method = bytes.readUInt16LE(at + 10);
    const size = bytes.readUInt32LE(at + 20);
    const nameLength = bytes.readUInt16LE(at + 28), extra = bytes.readUInt16LE(at + 30), comment = bytes.readUInt16LE(at + 32);
    const local = bytes.readUInt32LE(at + 42);
    const name = bytes.subarray(at + 46, at + 46 + nameLength).toString('utf8');
    const start = local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28);
    const data = bytes.subarray(start, start + size);
    parts[name] = method === 8 ? inflateRawSync(data) : data;
    at += 46 + nameLength + extra + comment;
  }
  return parts;
}
function column(n) {
  let s = '';
  for (n++; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + (n - 1) % 26) + s;
  return s;
}
function worksheet(sheet) {
  const ncols = sheet.rows[0].length;
  const end = column(ncols - 1) + sheet.rows.length;
  const rows = sheet.rows.map((row, i) => {
    const maxLines = Math.max(...row.map(v => String(v ?? '').split('\n').length));
    const height = i === 0 ? 32 : Math.min(150, Math.max(32, maxLines * 15));
    return '<row r="' + (i + 1) + '" ht="' + height + '" customHeight="1">' + row.map((v, j) => {
      const style = i === 0 ? 1 : v === 'Pass' ? 4 : v === 'Fail' ? 5 : v === 'Not run' || v === 'Blocked' ? 6 : i % 2 ? 2 : 3;
      const cell = '<c r="' + column(j) + (i + 1) + '" s="' + style + '"';
      return typeof v === 'number' ? cell + '><v>' + v + '</v></c>' : cell + ' t="inlineStr"><is><t xml:space="preserve">' + escape(v) + '</t></is></c>';
    }).join('') + '</row>';
  }).join('');
  const validation = sheet.resultColumns ? '<dataValidations count="' + sheet.resultColumns.length + '">' + sheet.resultColumns.map(c => '<dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="' + c + '2:' + c + sheet.rows.length + '"><formula1>"Not run,Pass,Fail,Blocked"</formula1></dataValidation>').join('') + '</dataValidations>' : '';
  return xml('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:' + end + '"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="30"/><cols>' + sheet.widths.map((w, i) => '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>').join('') + '</cols><sheetData>' + rows + '</sheetData><autoFilter ref="A1:' + end + '"/>' + validation + '<pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.3" footer="0.3"/><pageSetup orientation="landscape" paperSize="9"/></worksheet>');
}

export { zip, unzip, worksheet };

