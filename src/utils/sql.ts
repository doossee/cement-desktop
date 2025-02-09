import Database from '@tauri-apps/plugin-sql'

export const DB = Database.load("sqlite:database.db")

// const init = async () => {
    // const db = await DB

    // DROP TABLE IF EXISTS "users";
    // DROP TABLE IF EXISTS "clients";
    // DROP TABLE IF EXISTS "purchases";
    // DROP TABLE IF EXISTS "incomes";
    // db.execute(`

    // CREATE TABLE IF NOT EXISTS "users" (
    //     "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    //     "username" TEXT NOT NULL,
    //     "password" TEXT NOT NULL,
    //     "role" TEXT NOT NULL DEFAULT 'VIEWER',
    //     "last_login" DATETIME,
    //     "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    //     "updated_at" DATETIME NOT NULL
    // );

    // CREATE TABLE IF NOT EXISTS "clients" (
    //     "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    //     "name" TEXT NOT NULL,
    //     "phone" TEXT,
    //     "status" TEXT NOT NULL DEFAULT 'CLEAR',
    //     "balance" INTEGER NOT NULL DEFAULT 0,
    //     "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    //     "updated_at" DATETIME NOT NULL
    // );

    // CREATE TABLE IF NOT EXISTS "purchases" (
    //     "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    //     "client_id" INTEGER NOT NULL,
    //     "currency" INTEGER,
    //     "sack_num" INTEGER,
    //     "sack_price" INTEGER,
    //     "scatter_num" INTEGER,
    //     "scatter_price" INTEGER,
    //     "sum_price" INTEGER NOT NULL,
    //     "car_cost" INTEGER,
    //     "other_cost" INTEGER,
    //     "total_price" INTEGER NOT NULL,
    //     "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    //     "updated_at" DATETIME NOT NULL,
    //     CONSTRAINT "purchases_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    // );

    // CREATE TABLE IF NOT EXISTS "incomes" (
    //     "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    //     "client_id" INTEGER NOT NULL,
    //     "amount" INTEGER NOT NULL,
    //     "method" TEXT NOT NULL DEFAULT 'CASH',
    //     "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    //     "updated_at" DATETIME NOT NULL,
    //     CONSTRAINT "incomes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    // );`).then(() => {
    //     console.log("CREATED TABLES✅")
    // })
// }

// init()