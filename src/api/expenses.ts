import { DB } from '@/utils/sql'
import { Purchase, Income, Client, AnnualExpenses } from '@/utils/types'

interface ExpenseFilterParams {
    end: Date
    start: Date
    client_id: number
}

export const getExpenses = async ({ client_id, start, end }: ExpenseFilterParams) => {
    const db = await DB
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const [client]: any = await db.select<Client[]>("SELECT * FROM clients WHERE id = ?", [client_id]);

    const purchases = await db.select<Purchase[]>(`
        SELECT * FROM purchases 
        WHERE client_id = ? AND created_at BETWEEN ? AND ? 
    `, [client_id, start.toISOString(), end.toISOString()]);

    const incomes = await db.select<Income[]>(`
        SELECT * FROM incomes 
        WHERE client_id = ? AND created_at BETWEEN ? AND ? 
    `, [client_id, start.toISOString(), end.toISOString()]);

    const annual_expenses = await db.select<AnnualExpenses[]>(`
        SELECT * FROM annual_expenses WHERE client_id = ?
    `, [client_id]);

    return { client, purchases, incomes, annual_expenses };
};

export const createPurchase = async (data: Partial<Purchase>) => {
    const db = await DB
    await db.execute("UPDATE clients SET balance = balance - ? WHERE id = ?", [data.total_price, data.client_id]);

    const [{ balance }]: any = await db.select("SELECT balance FROM clients WHERE id = ?", [data.client_id]);

    const status = balance < 0 ? "DEBT" : balance === 0 ? "CLEAR" : "OWED";
    await db.execute("UPDATE clients SET status = ? WHERE id = ?", [status, data.client_id]);

    await db.execute(`
        INSERT INTO purchases (client_id, sack_num, sack_price, scatter_num, scatter_price, sum_price, car_cost, other_cost, total_price, currency, date, created_at, updated_at) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
        data.client_id, data.sack_num, data.sack_price, data.scatter_num, data.scatter_price,
        data.sum_price, data.car_cost, data.other_cost, data.total_price, data?.currency||null, data.date
    ]);
    const [newPurchase]: any = await db.select(`
        SELECT * FROM purchases WHERE client_id = $1 ORDER BY id DESC LIMIT 1
    `, [data.client_id]);


    // yearly
    const year = data.date?.getFullYear();
    
    // Создаём запись в annual_expenses, если её нет
    const ae_id = await createOrGet(data.client_id!, year!)

    await db.execute(`
        UPDATE annual_expenses
        SET total = total - $1, purchase = purchase + $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
    `, [data.total_price, ae_id]);
    
    return newPurchase
};

export const createIncome = async (data: Partial<Income>) => {
    const db = await DB
    const incomeAmount = data.currency ? data.currency * data.amount! : data.amount!
    await db.execute("UPDATE clients SET balance = balance + ? WHERE id = ?", [incomeAmount, data.client_id]);

    const [{ balance }]: any = await db.select("SELECT balance FROM clients WHERE id = ?", [data.client_id]);

    const status = balance < 0 ? "DEBT" : balance === 0 ? "CLEAR" : "OWED";
    await db.execute("UPDATE clients SET status = ? WHERE id = ?", [status, data.client_id]);

    await db.execute(`
        INSERT INTO incomes (client_id, amount, method, currency, date, created_at, updated_at) 
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [data.client_id, data.amount, data.method, data?.currency || null, data.date]);

    const [newPurchase]: any = await db.select(`
        SELECT * FROM incomes WHERE client_id = $1 ORDER BY id DESC LIMIT 1
    `, [data.client_id]);


    // yearly
    const year = data.date?.getFullYear();
    
    // Создаём запись в annual_expenses, если её нет
    const ae_id = await createOrGet(data.client_id!, year!)

    // Обновляем доход в annual_expenses
    await db.execute(`
        UPDATE annual_expenses
        SET total = total + $1, income = income + $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
    `, [incomeAmount, ae_id]);

    return newPurchase
};

export const createAnnualExpense = async (data: Partial<AnnualExpenses>) => {
    const db = await DB
    
    await db.execute(`
        INSERT INTO annual_expenses (client_id, year, total, income, purchase, created_at, updated_at)
        VALUES ($1, $2, $3, 0, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [data.client_id, data.year, -1 * data.purchase!, data.purchase]);

    return true
};

export const createOrGet = async (client_id: number, year: number) => {
    const db = await DB

    const [ae] = await db.select<AnnualExpenses[]>(`SELECT * FROM annual_expenses WHERE client_id = $1 AND year = $2`,
        [client_id, year])

    if(ae) return ae.id
    
    await db.execute(`
        INSERT INTO annual_expenses (client_id, year, total, income, purchase, created_at, updated_at)
        VALUES ($1, $2, 0, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [client_id, year]);

    const [newAE]: any = await db.select<AnnualExpenses[]>(`
        SELECT * FROM annual_expenses  WHERE client_id = $1 AND year = $2 ORDER BY id DESC LIMIT 1
    `, [client_id, year])

    return newAE.id
};