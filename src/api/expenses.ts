import { DB } from '@/utils/sql'
import { Purchase, Income, Client } from '@/utils/types'

interface ExpenseFilterParams {
    end: Date
    start: Date
    client_id: number
}

export const getExpenses = async ({ client_id, start, end }: ExpenseFilterParams) => {
    const db = await DB()
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const [client]: any = await db.select<Client[]>("SELECT * FROM clients WHERE id = ?", [client_id]);

    const purchases = await db.select<Purchase[]>(`
        SELECT * FROM purchases
        WHERE client_id = ? AND created_at BETWEEN ? AND ? 
    `, [client_id, start.toISOString(), end.toISOString()]);

    const [totalPurchase] = await db.select<Purchase[]>(`
        SELECT SUM(sack_num) as sack_num, 
            SUM(sack_price) as sack_price, 
            SUM(scatter_num) as scatter_num, 
            SUM(scatter_price) as scatter_price, 
            SUM(sum_price) as sum_price, 
            SUM(car_cost) as car_cost, 
            SUM(other_cost) as other_cost, 
            SUM(total_price) as total_price
        FROM purchases
        WHERE client_id = ? AND created_at BETWEEN ? AND ? 
    `, [client_id, start.toISOString(), end.toISOString()]);

    const incomes = await db.select<Income[]>(`
        SELECT * FROM incomes 
        WHERE client_id = ? AND created_at BETWEEN ? AND ? 
    `, [client_id, start.toISOString(), end.toISOString()]);

    const [totalIncomes] = await db.select<Income[]>(`
        SELECT SUM(
            CASE 
                WHEN currency IS NULL OR currency = 0 OR currency = 1 THEN amount 
                ELSE amount * currency 
            END
        ) as amount FROM incomes 
        WHERE client_id = ? AND created_at BETWEEN ? AND ? 
    `, [client_id, start.toISOString(), end.toISOString()]);

    return { client, purchases, incomes, totalPurchase, totalIncomes };
};

export const createPurchase = async (data: Partial<Purchase>) => {
    const db = await DB()
    await db.execute("UPDATE clients SET balance = balance - ? WHERE id = ?", [data.total_price, data.client_id]);

    const [{ balance }]: any = await db.select("SELECT balance FROM clients WHERE id = ?", [data.client_id]);

    const status = balance < 0 ? "DEBT" : balance === 0 ? "CLEAR" : "OWED";
    await db.execute("UPDATE clients SET status = ? WHERE id = ?", [status, data.client_id]);

    await db.execute(`
        INSERT INTO purchases (client_id, sack_num, sack_price, scatter_num, scatter_price, sum_price, car_cost, other_cost, total_price, currency, date, driver, comment, created_at, updated_at) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
        data.client_id, data.sack_num, data.sack_price, data.scatter_num, data.scatter_price,
        data.sum_price, data.car_cost, data.other_cost, data.total_price, data?.currency||null, data.date,
        data.driver || '', data.comment || ''
    ]);
    const [newPurchase]: any = await db.select(`
        SELECT * FROM purchases WHERE client_id = $1 ORDER BY id DESC LIMIT 1
    `, [data.client_id]);
    
    return newPurchase
};

export const createIncome = async (data: Partial<Income>) => {
    const db = await DB()
    const incomeAmount = data.currency ? data.currency * data.amount! : data.amount!
    await db.execute("UPDATE clients SET balance = balance + ? WHERE id = ?", [incomeAmount, data.client_id]);

    const [{ balance }]: any = await db.select("SELECT balance FROM clients WHERE id = ?", [data.client_id]);

    const status = balance < 0 ? "DEBT" : balance === 0 ? "CLEAR" : "OWED";
    await db.execute("UPDATE clients SET status = ? WHERE id = ?", [status, data.client_id]);

    await db.execute(`
        INSERT INTO incomes (client_id, amount, method, currency, date, comment, created_at, updated_at) 
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [data.client_id, data.amount, data.method, data?.currency || null, data.date, data.comment || '']);

    const [newPurchase]: any = await db.select(`
        SELECT * FROM incomes WHERE client_id = $1 ORDER BY id DESC LIMIT 1
    `, [data.client_id]);

    return newPurchase
};


export const deletePurchase = async (id: number, last_balance: number, client_id: number) => {
    const db = await DB();
    
    await db.execute("UPDATE clients SET balance = balance + ? WHERE id = ?", [last_balance, client_id]);
    
    await db.execute("DELETE FROM purchases WHERE id = ?", [id]);
    
    const [{ balance }] = await db.select<Client[]>("SELECT balance FROM clients WHERE id = ?", [client_id]);
    const status = balance < 0 ? "DEBT" : balance === 0 ? "CLEAR" : "OWED";
    await db.execute("UPDATE clients SET status = ? WHERE id = ?", [status, client_id]);

    return balance
};

export const updatePurchase = async (id: number, data: Partial<Purchase>, last_balance: number) => {
    const db = await DB();

    const fields = Object.keys(data).map((key) => `${key} = ?`).join(", ")
    const values = Object.values(data)
    values.push(id)
    
    await db.execute(`UPDATE purchases SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values)
    
    const balanceDiff = data.total_price! - last_balance;
    await db.execute("UPDATE clients SET balance = balance - ? WHERE id = ?", [balanceDiff, data.client_id]);
    
    const [{ balance }] = await db.select<Client[]>("SELECT balance FROM clients WHERE id = ?", [data.client_id]);
    const status = balance < 0 ? "DEBT" : balance === 0 ? "CLEAR" : "OWED";
    await db.execute("UPDATE clients SET status = ? WHERE id = ?", [status, data.client_id]);

    return balance
};


export const deleteIncome = async (id: number, last_balance: number, client_id: number) => {
    const db = await DB();
    
    await db.execute("UPDATE clients SET balance = balance - ? WHERE id = ?", [last_balance, client_id]);
    
    await db.execute("DELETE FROM incomes WHERE id = ?", [id]);
    
    const [{ balance }] = await db.select<Client[]>("SELECT balance FROM clients WHERE id = ?", [client_id]);
    const status = balance < 0 ? "DEBT" : balance === 0 ? "CLEAR" : "OWED";
    await db.execute("UPDATE clients SET status = ? WHERE id = ?", [status, client_id]);

    return balance
};

export const updateIncome = async (id: number, data: Partial<Income>, last_balance: number) => {
    const db = await DB();
    
    const newIncomeAmount = data.currency && data.amount ? data.currency * data.amount : (data.amount||0);
    const balanceDiff = newIncomeAmount - last_balance;
    
    await db.execute("UPDATE clients SET balance = balance + ? WHERE id = ?", [balanceDiff, data.client_id]);
    
    const fields = Object.keys(data).map((key) => `${key} = ?`).join(", ")
    const values = Object.values(data)
    values.push(id)
    
    await db.execute(`UPDATE incomes SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values)

    const [{ balance }] = await db.select<Client[]>("SELECT balance FROM clients WHERE id = ?", [data.client_id]);
    const status = balance < 0 ? "DEBT" : balance === 0 ? "CLEAR" : "OWED";
    await db.execute("UPDATE clients SET status = ? WHERE id = ?", [status, data.client_id]);

    return balance
};


export const deleteExpanses = async () => {
    const db = await DB()

    await db.execute(`
        PRAGMA foreign_keys = OFF;

        DELETE FROM purchases;
        DELETE FROM incomes;

        UPDATE clients 
        SET initial_debt = -balance + initial_debt, 
            balance = 0;

        PRAGMA foreign_keys = ON;`)

    return true
};