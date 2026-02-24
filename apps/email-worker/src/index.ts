import { ImapClient } from './imap';

interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
  EMAIL_QUEUE: Queue;
}

interface SyncTask {
  userId: string;
  credentialId: string;
  email: string;
  imapHost: string;
  imapPort: number;
  encryptedData: string;
  lastSyncUid: number;
}

export default {
  // Cron: dispatch sync tasks to queue
  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    const { results } = await env.DB.prepare(
      `SELECT uc.id as credential_id, uc.user_id, u.email, uc.imap_host, uc.imap_port, uc.encrypted_data, uc.last_sync_uid
       FROM user_credentials uc
       JOIN users u ON u.id = uc.user_id
       WHERE uc.sync_enabled = 1`
    ).all<{
      credential_id: string;
      user_id: string;
      email: string;
      imap_host: string;
      imap_port: number;
      encrypted_data: string;
      last_sync_uid: number;
    }>();

    if (!results?.length) return;

    const batch = results.map((r) => ({
      body: {
        userId: r.user_id,
        credentialId: r.credential_id,
        email: r.email,
        imapHost: r.imap_host,
        imapPort: r.imap_port,
        encryptedData: r.encrypted_data,
        lastSyncUid: r.last_sync_uid ?? 0,
      } satisfies SyncTask,
    }));

    // Queue accepts max 100 messages per batch
    for (let i = 0; i < batch.length; i += 100) {
      await env.EMAIL_QUEUE.send(batch.slice(i, i + 100));
    }
  },

  // Queue consumer: process individual sync tasks
  async queue(batch: MessageBatch<SyncTask>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      try {
        await syncUser(msg.body, env);
        msg.ack();
      } catch (e) {
        console.error(`Sync failed for ${msg.body.email}:`, e);
        msg.retry();
      }
    }
  },
};

async function syncUser(task: SyncTask, env: Env): Promise<void> {
  // TODO: decrypt task.encryptedData to get password
  const password = task.encryptedData; // placeholder until encryption is implemented

  const client = await ImapClient.connect(task.imapHost, task.imapPort);

  try {
    const loggedIn = await client.login(task.email, password);
    if (!loggedIn) throw new Error('IMAP login failed');

    await client.selectInbox();
    const newUids = await client.searchSinceUid(task.lastSyncUid);
    if (!newUids.length) return;

    let maxUid = task.lastSyncUid;

    for (const uid of newUids) {
      const { raw, headers } = await client.fetchRaw(uid);
      const emailId = crypto.randomUUID();
      const r2Key = `emails/${task.userId}/${emailId}.eml`;
      const now = Date.now();

      // Store raw email to R2
      await env.STORAGE.put(r2Key, raw, {
        customMetadata: {
          from: headers.from,
          to: headers.to,
          subject: headers.subject,
        },
      });

      // Insert metadata to D1
      await env.DB.prepare(
        `INSERT INTO emails (id, user_id, message_id, subject, from_address, to_address, received_date, r2_key, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
      )
        .bind(
          emailId,
          task.userId,
          headers.messageId || emailId,
          headers.subject || null,
          headers.from,
          headers.to,
          headers.date ? new Date(headers.date).getTime() : now,
          r2Key,
          now
        )
        .run();

      if (uid > maxUid) maxUid = uid;
    }

    // Update last sync UID
    await env.DB.prepare('UPDATE user_credentials SET last_sync_uid = ? WHERE id = ?')
      .bind(maxUid, task.credentialId)
      .run();
  } finally {
    await client.logout();
  }
}
