export interface DataTableHeaders<T> {
  key: string | keyof T
  title: string,
  sorting?: boolean
  class?: string
}

export interface DataTableProps<T> {
  items: T[]
  count: number
  trClass?: string
  loading?: boolean
  hideTop?: boolean
  clientSide?: boolean
  hideBottom?: boolean
  hideSearch?: boolean
  headers: DataTableHeaders<T>[],
}


export type Role = "ADMIN" | "VIEWER";

export type ClientStatus = "DEBT" | "CLEAR" | "OWED";

export type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "INSURANCE" | "NOTARY";

export interface User {
  id: number;
  username: string;
  password: string;
  role: Role | string;
  last_login: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Client {
  id: number;
  name: string;
  phone?: string | null;
  status: ClientStatus;
  balance: number;
  created_at: Date;
  updated_at: Date;
  purchases: Purchase[];
  incomes: Income[];
}

export interface Purchase {
  id: number;
  client_id: number;
  client: Client;
  sack_num?: number | null;
  sack_price?: number | null;
  scatter_num?: number | null;
  scatter_price?: number | null;
  sum_price: number;
  currency?: number;
  car_cost?: number | null;
  other_cost?: number | null;
  total_price: number;
  created_at: Date;
  updated_at: Date;
}

export interface Income {
  id: number;
  client_id: number;
  client: Client;
  amount: number;
  currency?: number;
  method: PaymentMethod;
  created_at: Date;
  updated_at: Date;
}