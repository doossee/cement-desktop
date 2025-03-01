export interface DataTableHeaders<T> {
  key: string | keyof T
  title: string,
  sorting?: boolean
  class?: string
}

export interface DataTableProps<T> {
  items: T[]
  count: number
  totalItem?: T | null
  trClass?: string
  loading?: boolean
  hideTop?: boolean
  clientSide?: boolean
  hideBottom?: boolean
  hideSearch?: boolean
  headers: DataTableHeaders<T>[],
}


export type Role = "ADMIN" | "VIEWER";

export type ClientType = "DAILY" | "BIG";

export type ClientStatus = "DEBT" | "CLEAR" | "OWED";

export type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "INSURANCE" | "NOTARY";

export interface User {
  id: number;
  username: string;
  password: string;
  last_login: Date;
  created_at: Date;
  updated_at: Date;
  role: Role | string;
}

export interface Client {
  id: number;
  name: string;
  comment: string;
  balance: number;
  created_at: Date;
  updated_at: Date;
  incomes: Income[];
  initial_debt: number;
  status: ClientStatus;
  phone?: string | null;
  purchases: Purchase[];
  type: ClientType | string;
}

export interface Purchase {
  id: number;
  date: Date;
  client: Client;
  driver: string;
  comment: string;
  created_at: Date;
  updated_at: Date;
  client_id: number;
  sum_price: number;
  currency?: number;
  total_price: number;
  car_cost?: number | null;
  sack_num?: number | null;
  other_cost?: number | null;
  sack_price?: number | null;
  scatter_num?: number | null;
  scatter_price?: number | null;
}

export interface Income {
  id: number
  date: Date
  client: Client
  amount: number
  comment: string
  created_at: Date
  updated_at: Date
  client_id: number
  currency?: number
  method: PaymentMethod
}