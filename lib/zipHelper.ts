/**
 * Zero-dependency client-side ZIP generator for exporting multi-file projects.
 * Generates valid standard PKZip archives using standard Uint8Array & CRC32.
 */

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
})();

function crc32(buf: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

export function createZipBlob(files: { name: string; content: string }[]): Blob {
  const encoder = new TextEncoder();
  const fileEntries: {
    nameBytes: Uint8Array;
    contentBytes: Uint8Array;
    crc: number;
    offset: number;
  }[] = [];

  const localHeaders: Uint8Array[] = [];
  let currentOffset = 0;

  // 1. Build Local File Headers and payload
  for (const f of files) {
    const nameBytes = encoder.encode(f.name.replace(/\\/g, "/"));
    const contentBytes = encoder.encode(f.content);
    const crc = crc32(contentBytes);

    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);

    view.setUint32(0, 0x04034b50, true); // Local file header signature
    view.setUint16(4, 20, true);         // Version needed
    view.setUint16(6, 0x0800, true);     // General purpose bit flag (UTF-8)
    view.setUint16(8, 0, true);          // Compression method (stored / uncompressed)
    view.setUint16(10, 0x5460, true);    // Last mod file time
    view.setUint16(12, 0x5460, true);    // Last mod file date
    view.setUint32(14, crc, true);       // CRC-32
    view.setUint32(18, contentBytes.length, true); // Compressed size
    view.setUint32(22, contentBytes.length, true); // Uncompressed size
    view.setUint16(26, nameBytes.length, true);    // Filename length
    view.setUint16(28, 0, true);                   // Extra field length

    header.set(nameBytes, 30);

    fileEntries.push({
      nameBytes,
      contentBytes,
      crc,
      offset: currentOffset,
    });

    localHeaders.push(header);
    localHeaders.push(contentBytes);
    currentOffset += header.length + contentBytes.length;
  }

  // 2. Build Central Directory
  const centralDirHeaders: Uint8Array[] = [];
  let centralDirSize = 0;

  for (const entry of fileEntries) {
    const cdir = new Uint8Array(46 + entry.nameBytes.length);
    const view = new DataView(cdir.buffer);

    view.setUint32(0, 0x02014b50, true); // Central file header signature
    view.setUint16(4, 20, true);         // Version made by
    view.setUint16(6, 20, true);         // Version needed
    view.setUint16(8, 0x0800, true);     // Flag (UTF-8)
    view.setUint16(10, 0, true);         // Compression method
    view.setUint16(12, 0x5460, true);    // Time
    view.setUint16(14, 0x5460, true);    // Date
    view.setUint32(16, entry.crc, true); // CRC-32
    view.setUint32(20, entry.contentBytes.length, true); // Compressed size
    view.setUint32(24, entry.contentBytes.length, true); // Uncompressed size
    view.setUint16(28, entry.nameBytes.length, true);    // Filename length
    view.setUint16(30, 0, true);         // Extra field length
    view.setUint16(32, 0, true);         // File comment length
    view.setUint16(34, 0, true);         // Disk number start
    view.setUint16(36, 0, true);         // Internal file attributes
    view.setUint32(38, 0, true);         // External file attributes
    view.setUint32(42, entry.offset, true); // Relative offset of local header

    cdir.set(entry.nameBytes, 46);
    centralDirHeaders.push(cdir);
    centralDirSize += cdir.length;
  }

  // 3. End of Central Directory Record (EOCD)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true); // EOCD signature
  eocdView.setUint16(4, 0, true);          // Number of this disk
  eocdView.setUint16(6, 0, true);          // Disk where central directory starts
  eocdView.setUint16(8, fileEntries.length, true);  // Number of central directory records on this disk
  eocdView.setUint16(10, fileEntries.length, true); // Total number of central directory records
  eocdView.setUint32(12, centralDirSize, true);     // Size of central directory
  eocdView.setUint32(16, currentOffset, true);      // Offset of start of central directory
  eocdView.setUint16(20, 0, true);                  // ZIP file comment length

  return new Blob([...localHeaders, ...centralDirHeaders, eocd], {
    type: "application/zip",
  });
}

export function downloadProjectZip(projectName: string, files: { name: string; content: string }[]) {
  if (files.length === 0) return;
  const blob = createZipBlob(files);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const cleanName = (projectName || "project").replace(/[^a-zA-Z0-9_-]/g, "_");
  a.href = url;
  a.download = `${cleanName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
