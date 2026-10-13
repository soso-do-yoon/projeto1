CREATE TABLE IF NOT EXISTS oauth_transactions (
id_hash TEXT PRIMARY KEY,
provider TEXT NOT NULL,
state_hash TEXT NOT NULL,
nonce TEXT,
code_verifier TEXT NOT NULL,
expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
id_hash TEXT PRIMARY KEY,
issuer TEXT NOT NULL,
subject TEXT NOT NULL,
email TEXT,
display_name TEXT,
expires_at INTEGER NOT NULL,
created_at INTEGER NOT NULL
);
