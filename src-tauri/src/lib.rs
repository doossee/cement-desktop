// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration{
            version: 1,
            description: "create all tables",
            sql: "CREATE TABLE IF NOT EXISTS \"users\" (
                \"id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                \"username\" TEXT NOT NULL UNIQUE,
                \"password\" TEXT NOT NULL,
                \"role\" TEXT NOT NULL DEFAULT 'VIEWER',
                \"last_login\" DATETIME,
                \"created_at\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \"updated_at\" DATETIME NOT NULL
            );

            CREATE TABLE IF NOT EXISTS \"clients\" (
                \"id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                \"name\" TEXT NOT NULL,
                \"phone\" TEXT,
                \"status\" TEXT NOT NULL DEFAULT 'CLEAR',
                \"type\" TEXT NOT NULL DEFAULT 'DAILY',
                \"balance\" INTEGER NOT NULL DEFAULT 0,
                \"initial_debt\" INTEGER,
                \"created_at\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \"updated_at\" DATETIME NOT NULL
            );

            CREATE TABLE IF NOT EXISTS \"purchases\" (
                \"id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                \"client_id\" INTEGER NOT NULL,
                \"currency\" FLOAT,
                \"sack_num\" INTEGER,
                \"sack_price\" INTEGER,
                \"scatter_num\" INTEGER,
                \"scatter_price\" INTEGER,
                \"sum_price\" INTEGER NOT NULL,
                \"car_cost\" INTEGER,
                \"other_cost\" INTEGER,
                \"total_price\" INTEGER NOT NULL,
                \"date\" DATETIME NOT NULL,
                \"created_at\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \"updated_at\" DATETIME NOT NULL,
                CONSTRAINT \"purchases_client_id_fkey\" FOREIGN KEY (\"client_id\") REFERENCES \"clients\" (\"id\") ON DELETE RESTRICT ON UPDATE CASCADE
            );

            CREATE TABLE IF NOT EXISTS \"incomes\" (
                \"id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                \"client_id\" INTEGER NOT NULL,
                \"currency\" FLOAT,
                \"amount\" INTEGER NOT NULL,
                \"method\" TEXT NOT NULL DEFAULT 'CASH',
                \"date\" DATETIME NOT NULL,
                \"created_at\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \"updated_at\" DATETIME NOT NULL,
                CONSTRAINT \"incomes_client_id_fkey\" FOREIGN KEY (\"client_id\") REFERENCES \"clients\" (\"id\") ON DELETE RESTRICT ON UPDATE CASCADE
            );
            
            INSERT OR IGNORE INTO users (username, password, role, created_at, updated_at)
            VALUES
                ('admin', '123', 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                ('nazoratchi', '123', 'VIEWER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);",
            kind: MigrationKind::Up
        }
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:database.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
