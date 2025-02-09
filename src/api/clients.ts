import { DB } from '@/utils/sql'
import { Client } from '@/utils/types'

interface ClientFilterParams {
    page: number
    limit: number
    search?: string
    sorting?: Partial<Record<keyof Client, "asc" | "desc">>
    filters?: Partial<Record<keyof Pick<Client, 'id' | 'status'> | 'startDate' | 'endDate', number | string>>
}

export const getClients = async ({ limit = 10, page = 1, search = '', sorting = {}, filters = {} }: ClientFilterParams) => {
    const db = await DB

    let whereClauses: (string|number)[] = []
    let params: (string|number)[] = []
    
    if (search) {
        whereClauses.push("(name LIKE ? OR phone LIKE ?)")
        params.push(`%${search}%`, `%${search}%`)
    }
    
    if (filters.id) {
        whereClauses.push("id = ?")
        params.push(filters.id)
    }
    
    if (filters.status) {
        whereClauses.push("status = ?")
        params.push(filters.status)
    }
    
    if (filters.startDate && filters.endDate) {
        whereClauses.push("created_at BETWEEN ? AND ?")
        params.push(filters.startDate, filters.endDate)
    } else if (filters.startDate) {
        whereClauses.push("created_at BETWEEN ? AND ?")
        const endOfDay = new Date(filters.startDate)
        endOfDay.setHours(23, 59, 59, 999)
        params.push(filters.startDate, endOfDay.toISOString())
    }
    
    let whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : ""
    
    let orderSQL = Object.keys(sorting).length
        ? `ORDER BY ${Object.entries(sorting).map(([key, order]) => `${key} ${order}`).join(", ")}`
        : ""
    
    const offset = (page - 1) * limit
    
    const countResult: any = await db.select("SELECT COUNT(*) as count FROM clients " + whereSQL, params)
    const count = countResult[0]?.count || 0
    
    const items = await db.select<Client[]>(
        `SELECT * FROM clients ${whereSQL} ${orderSQL} LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    )
    
    return { items, count }
}

export const getAllClients = async () => {
    const db = await DB

    const items = await db.select<Client[]>(`SELECT * FROM clients`)
    
    return { items }
}

export const createClient = async (data: Partial<Client>) => {
    const db = await DB

    const { name, phone, status, balance } = data
    await db.execute(
        "INSERT INTO clients (name, phone, status, balance, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
        [name, phone, status || 'CLEAR', balance || 0]
    )

    const [newClient]: any = await db.select(`
        SELECT * FROM clients ORDER BY id DESC LIMIT 1
    `);

    return newClient
}

export const updateClient = async (id: number, data: Partial<Client>) => {
    const db = await DB

    const fields = Object.keys(data).map((key) => `${key} = ?`).join(", ")
    const values = Object.values(data)
    values.push(id)
    
    await db.execute(`UPDATE clients SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values)
    const [updatedClient]: any = await db.select(`
        SELECT * FROM clients WHERE id = ?
    `, [id]);

    return updatedClient
}

export const deleteClient = async (id: number) => {
    const db = await DB

    await db.execute("DELETE FROM clients WHERE id = ?", [id])
    return true
}