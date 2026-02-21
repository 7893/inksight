-- Inksight Database Schema
-- Version: 1.0
-- Target: Cloudflare D1

-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    tone_preference TEXT DEFAULT 'professional',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX idx_users_email ON users(email);

-- Emails table (core metadata)
CREATE TABLE emails (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    subject TEXT,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    received_date INTEGER NOT NULL,
    category TEXT CHECK(category IN ('newsletter', 'financial', 'travel', 'personal', 'spam')),
    r2_key TEXT NOT NULL,
    processed_at INTEGER,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_emails_user_id ON emails(user_id);
CREATE INDEX idx_emails_category ON emails(user_id, category);
CREATE INDEX idx_emails_date ON emails(user_id, received_date DESC);
CREATE INDEX idx_emails_status ON emails(status);

-- Finance table (extracted transactions)
CREATE TABLE finance (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    email_id TEXT NOT NULL,
    merchant TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    transaction_date INTEGER NOT NULL,
    category TEXT,
    description TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
);

CREATE INDEX idx_finance_user_id ON finance(user_id);
CREATE INDEX idx_finance_date ON finance(user_id, transaction_date DESC);
CREATE INDEX idx_finance_merchant ON finance(user_id, merchant);

-- Trips table (travel bookings)
CREATE TABLE trips (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    email_id TEXT NOT NULL,
    destination TEXT NOT NULL,
    departure_date INTEGER NOT NULL,
    return_date INTEGER,
    booking_ref TEXT,
    carrier TEXT,
    trip_type TEXT CHECK(trip_type IN ('flight', 'hotel', 'train', 'car', 'other')),
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
);

CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_date ON trips(user_id, departure_date DESC);

-- News table (newsletters & subscriptions)
CREATE TABLE news (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    email_id TEXT NOT NULL,
    source TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    bullet_points TEXT,
    url TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
);

CREATE INDEX idx_news_user_id ON news(user_id);
CREATE INDEX idx_news_source ON news(user_id, source);

-- Embeddings table (vector search metadata)
CREATE TABLE embeddings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    email_id TEXT NOT NULL,
    content_type TEXT CHECK(content_type IN ('subject', 'body', 'summary')),
    vector_id TEXT NOT NULL,
    text_chunk TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
);

CREATE INDEX idx_embeddings_user_id ON embeddings(user_id);
CREATE INDEX idx_embeddings_email_id ON embeddings(email_id);

-- User credentials (encrypted)
CREATE TABLE user_credentials (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    provider TEXT NOT NULL CHECK(provider IN ('imap', 'jmap', 'oauth')),
    encrypted_data TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_credentials_user_id ON user_credentials(user_id);

-- Audit log
CREATE TABLE audit_log (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    metadata TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_audit_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_created_at ON audit_log(created_at DESC);
