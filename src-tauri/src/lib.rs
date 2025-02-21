// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri_plugin_sql::{Migration, MigrationKind};
use std::fs;
use std::path::Path;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn backup_database(arg1: String, arg2: String, arg3: String) -> Result<String, String> {
    // Проверяем, существует ли указанная папка, если нет — создаем
    // format!("{}, {}, {}", arg1, arg2, arg3);
    let backup_path = Path::new(&arg3);
    if !backup_path.exists() {
        fs::create_dir_all(backup_path)
            .map_err(|e| format!("Ошибка создания папки: {}", e))?;
    }

    // Полный путь к файлу бэкапа
    let backup_file_path = backup_path.join(format!("backup_{}.db", arg1));

    // Копируем базу данных
    fs::copy(arg2, &backup_file_path)
        .map_err(|e| format!("Ошибка копирования файла: {}", e))?;

    Ok(backup_file_path.to_string_lossy().to_string()) // Возвращаем путь к бэкапу
}

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
        .invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(tauri::generate_handler![backup_database])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
