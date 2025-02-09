import { DB } from '@/utils/sql'
import { User } from '@/utils/types'

interface UserFilterParams {
    page: number
    limit: number
    search?: string
    sorting?: Partial<Record<keyof User, "asc" | "desc">>
    filters?: Partial<Record<keyof Pick<User, 'id' | 'role'> | 'startDate' | 'endDate', number | string>>
}

export const getUsers = async ({ limit = 10, page = 1, search = '', sorting = {}, filters = {} }: UserFilterParams) => {
    const db = await DB

    let whereClauses: (string|number)[] = []
    let params: (string|number)[] = []
    
    if (search) {
        whereClauses.push("(username LIKE ?)")
        params.push(`%${search}%`)
    }
    
    if (filters.id) {
        whereClauses.push("id = ?")
        params.push(filters.id)
    }
    
    if (filters.role) {
        whereClauses.push("role = ?")
        params.push(filters.role)
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
    
    const countResult: any = await db.select("SELECT COUNT(*) as count FROM users " + whereSQL, params)
    const count = countResult[0]?.count || 0
    
    const items = await db.select(
        `SELECT * FROM users ${whereSQL} ${orderSQL} LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    )
    
    return { items, count }
}

export const createUser = async (data: Partial<User>) => {
    const db = await DB

    const { password, role, username } = data
    await db.execute(
        "INSERT INTO users (username, password, role, created_at, updated_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
        [username, password, role || 'VIEWER']
    )

    const [user]: any = await db.select(`
        SELECT * FROM users ORDER BY id DESC LIMIT 1
    `);

    return user
}

export const updateUser = async (id: number, data: Partial<User>) => {
    const db = await DB

    const fields = Object.keys(data).map((key) => `${key} = ?`).join(", ")
    const values = Object.values(data)
    values.push(id)
    
    await db.execute(`UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values)
    const [user]: any = await db.select(`
        SELECT * FROM users WHERE id = ?
    `, [id]);

    return user
}

export const deleteUser = async (id: number) => {
    const db = await DB

    await db.execute("DELETE FROM users WHERE id = ?", [id])
    return true
}

export const loginUser = async (data: Partial<User>) => {
    const db = await DB
    const { password, username } = data
    const [user]: any = await db.select("SELECT * from users WHERE username = $1", [username])

    if(!user || user.password !== password) return null

    return user
}