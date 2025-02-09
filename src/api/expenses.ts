import { DB } from '@/utils/sql'
import { Purchase, Income, Client } from '@/utils/types'

interface ExpenseFilterParams {
    end: Date
    start: Date
    client_id: number
}

export const getExpenses = async ({ client_id, start, end }: ExpenseFilterParams) => {
    const db = await DB
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // const sortBy = Object.entries(sorting)
    //     .map(([key, order]) => `${key} ${order}`)
    //     .join(', ');

    const [client]: any = await db.select<Client[]>("SELECT * FROM clients WHERE id = ?", [client_id]);

    const purchases = await db.select<Purchase[]>(`
        SELECT * FROM purchases 
        WHERE client_id = ? AND created_at BETWEEN ? AND ? 
    `, [client_id, start.toISOString(), end.toISOString()]);
        // ${sortBy ? `ORDER BY ${sortBy}` : ''}
        
    const incomes = await db.select<Income[]>(`
        SELECT * FROM incomes 
        WHERE client_id = ? AND created_at BETWEEN ? AND ? 
    `, [client_id, start.toISOString(), end.toISOString()]);
        // ${sortBy ? `ORDER BY ${sortBy}` : ''}

    return { client, purchases, incomes };
};

export const createPurchase = async (data: Partial<Purchase>) => {
    const db = await DB
    await db.execute("UPDATE clients SET balance = balance - ? WHERE id = ?", [data.total_price, data.client_id]);

    const [{ balance }]: any = await db.select("SELECT balance FROM clients WHERE id = ?", [data.client_id]);

    const status = balance < 0 ? "DEBT" : balance === 0 ? "CLEAR" : "OWED";
    await db.execute("UPDATE clients SET status = ? WHERE id = ?", [status, data.client_id]);

    await db.execute(`
        INSERT INTO purchases (client_id, sack_num, sack_price, scatter_num, scatter_price, sum_price, car_cost, other_cost, total_price, currency, created_at, updated_at) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
        data.client_id, data.sack_num, data.sack_price, data.scatter_num, data.scatter_price,
        data.sum_price, data.car_cost, data.other_cost, data.total_price, data?.currency||null
    ]);
    const [newPurchase]: any = await db.select(`
        SELECT * FROM purchases WHERE client_id = $1 ORDER BY id DESC LIMIT 1
    `, [data.client_id]);
    
    return newPurchase
};

export const createIncome = async (data: Partial<Income>) => {
    const db = await DB

    await db.execute("UPDATE clients SET balance = balance + ? WHERE id = ?", [data.currency ? data.currency * data.amount! : data.amount, data.client_id]);

    const [{ balance }]: any = await db.select("SELECT balance FROM clients WHERE id = ?", [data.client_id]);

    const status = balance < 0 ? "DEBT" : balance === 0 ? "CLEAR" : "OWED";
    await db.execute("UPDATE clients SET status = ? WHERE id = ?", [status, data.client_id]);

    await db.execute(`
        INSERT INTO incomes (client_id, amount, method, currency, created_at, updated_at) 
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [data.client_id, data.amount, data.method, data?.currency || null]);

    const [newPurchase]: any = await db.select(`
        SELECT * FROM incomes WHERE client_id = $1 ORDER BY id DESC LIMIT 1
    `, [data.client_id]);

    return newPurchase
};