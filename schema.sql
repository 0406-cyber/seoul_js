-- 1. users 테이블 (구글 시트 users 탭)
CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    login_count INTEGER DEFAULT 1,
    points INTEGER DEFAULT 100
);

-- 2. usage 테이블 (구글 시트 usage 탭)
CREATE TABLE IF NOT EXISTS usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    date TEXT NOT NULL,
    elec_kwh REAL DEFAULT 0,
    gas_m3 REAL DEFAULT 0,
    co2_kg REAL DEFAULT 0,
    FOREIGN KEY(username) REFERENCES users(username)
);

-- 3. logs 테이블 (구글 시트 logs 탭)
CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    amount INTEGER DEFAULT 0,
    FOREIGN KEY(username) REFERENCES users(username)
);

-- 4. feed 테이블 (구글 시트 feed 탭)
CREATE TABLE IF NOT EXISTS feed (
    id TEXT PRIMARY KEY,
    author TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    imageDataUrl TEXT,
    createdAt INTEGER NOT NULL,
    likedBy TEXT DEFAULT '[]'
);

-- 5. orders 테이블 (구글 시트 orders 탭)
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    itemId TEXT NOT NULL,
    itemName TEXT NOT NULL,
    cost INTEGER DEFAULT 0,
    requestedAt TEXT NOT NULL,
    status TEXT DEFAULT 'requested',
    FOREIGN KEY(username) REFERENCES users(username)
);

-- 6. server_logs 테이블 (구글 시트 server_logs 탭)
CREATE TABLE IF NOT EXISTS server_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    action TEXT NOT NULL,
    ip TEXT NOT NULL,
    country TEXT NOT NULL,
    device TEXT NOT NULL
);

-- 7. certifications 테이블 (구글 시트 certifications 탭)
CREATE TABLE IF NOT EXISTS certifications (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    date TEXT NOT NULL,
    type TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    FOREIGN KEY(username) REFERENCES users(username)
);

-- 8. coaching_chats 테이블 (구글 시트 coaching_chats 탭)
CREATE TABLE IF NOT EXISTS coaching_chats (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    role TEXT CHECK(role IN ('user', 'assistant')) NOT NULL,
    content TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY(username) REFERENCES users(username)
);