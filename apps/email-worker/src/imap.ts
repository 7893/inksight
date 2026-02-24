const ENCODER = new TextEncoder();
const DECODER = new TextDecoder();

interface ImapResponse {
  tag: string;
  lines: string[];
  ok: boolean;
}

export class ImapClient {
  private reader: ReadableStreamDefaultReader<Uint8Array>;
  private writer: WritableStreamDefaultWriter<Uint8Array>;
  private tagCounter = 0;
  private buffer = '';

  constructor(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    writer: WritableStreamDefaultWriter<Uint8Array>,
  ) {
    this.reader = reader;
    this.writer = writer;
  }

  static async connect(host: string, port: number): Promise<ImapClient> {
    const socket = connect({ hostname: host, port }, { secureTransport: 'on' });
    const reader = socket.readable.getReader();
    const writer = socket.writable.getWriter();
    const client = new ImapClient(reader, writer);
    await client.readUntilTag('*'); // server greeting
    return client;
  }

  private nextTag(): string {
    return `A${++this.tagCounter}`;
  }

  private async send(command: string): Promise<ImapResponse> {
    const tag = this.nextTag();
    await this.writer.write(ENCODER.encode(`${tag} ${command}\r\n`));
    return this.readUntilTag(tag);
  }

  private async readUntilTag(expectedTag: string): Promise<ImapResponse> {
    const lines: string[] = [];

    while (true) {
      // Read more data if buffer has no complete line
      while (!this.buffer.includes('\r\n')) {
        const { value, done } = await this.reader.read();
        if (done) throw new Error('Connection closed');
        this.buffer += DECODER.decode(value);
      }

      const lineEnd = this.buffer.indexOf('\r\n');
      const line = this.buffer.slice(0, lineEnd);
      this.buffer = this.buffer.slice(lineEnd + 2);

      // Check for literal {N} continuation
      const literalMatch = line.match(/\{(\d+)\}$/);
      if (literalMatch) {
        const literalSize = parseInt(literalMatch[1]);
        while (ENCODER.encode(this.buffer).length < literalSize + 2) {
          const { value, done } = await this.reader.read();
          if (done) throw new Error('Connection closed during literal');
          this.buffer += DECODER.decode(value);
        }
        // Read literalSize bytes + \r\n
        let collected = '';
        let byteCount = 0;
        for (const char of this.buffer) {
          if (byteCount >= literalSize) break;
          collected += char;
          byteCount += ENCODER.encode(char).length;
        }
        this.buffer = this.buffer.slice(collected.length);
        // Skip trailing \r\n after literal
        if (this.buffer.startsWith('\r\n')) {
          this.buffer = this.buffer.slice(2);
        }
        lines.push(line + '\r\n' + collected);
        continue;
      }

      lines.push(line);

      if (expectedTag === '*' && line.startsWith('* ')) {
        return { tag: '*', lines, ok: true };
      }

      if (line.startsWith(`${expectedTag} `)) {
        const ok = line.includes(`${expectedTag} OK`);
        return { tag: expectedTag, lines, ok };
      }
    }
  }

  async login(user: string, pass: string): Promise<boolean> {
    const res = await this.send(`LOGIN "${user}" "${pass}"`);
    return res.ok;
  }

  async selectInbox(): Promise<void> {
    await this.send('SELECT INBOX');
  }

  async searchSinceUid(uid: number): Promise<number[]> {
    const cmd = uid > 0 ? `UID SEARCH UID ${uid + 1}:*` : 'UID SEARCH ALL';
    const res = await this.send(cmd);
    const searchLine = res.lines.find((l) => l.startsWith('* SEARCH'));
    if (!searchLine) return [];
    const uids = searchLine
      .replace('* SEARCH', '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(Number)
      .filter((u) => u > uid);
    return uids;
  }

  async fetchRaw(uid: number): Promise<{ raw: string; headers: { messageId: string; subject: string; from: string; to: string; date: string } }> {
    const res = await this.send(`UID FETCH ${uid} (BODY[] BODY[HEADER.FIELDS (MESSAGE-ID SUBJECT FROM TO DATE)])`);

    let raw = '';
    let headerBlock = '';

    for (const line of res.lines) {
      if (line.includes('BODY[]') && !line.includes('HEADER.FIELDS')) {
        const idx = line.indexOf('\r\n');
        raw = idx >= 0 ? line.slice(idx + 2) : '';
      } else if (line.includes('HEADER.FIELDS')) {
        const idx = line.indexOf('\r\n');
        headerBlock = idx >= 0 ? line.slice(idx + 2) : '';
      }
    }

    const getHeader = (name: string): string => {
      const re = new RegExp(`^${name}:\\s*(.+)`, 'im');
      const m = headerBlock.match(re);
      return m ? m[1].trim() : '';
    };

    return {
      raw,
      headers: {
        messageId: getHeader('Message-ID'),
        subject: getHeader('Subject'),
        from: getHeader('From'),
        to: getHeader('To'),
        date: getHeader('Date'),
      },
    };
  }

  async logout(): Promise<void> {
    try {
      await this.send('LOGOUT');
    } catch {
      // ignore close errors
    }
  }
}
