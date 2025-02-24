import { Users, Shield, Settings } from 'lucide-vue-next'
import type { ClientStatus, PaymentMethod, Role, ClientType } from './types'

export const EXPIRATION_TIME = 3 * 60 * 60 * 1000;

export const ALERT_MESSAGES = {
    DATA_CREATED: "Ma'lumot muvaffaqiyatli yaratildi!",
    DATA_UPDATED: "Ma'lumot muvaffaqiyatli yangilandi!",
    DATA_DELETED: "Ma'lumot muvaffaqiyatli o'chirildi!",
    DATA_NOT_FOUND: "Ma'lumot topilmadi!",
    INVALID_INPUT: "Kiritilgan ma'lumot noto'g'ri!",
    ACCESS_DENIED: "Kirish taqiqlangan!",
    LOGIN_SUCCESS: "Muvaffaqiyatli kirildi!",
    LOGIN_FAILED: "Login yoki parol noto'g'ri!",
    PERMISSION_REQUIRED: "Ruxsat talab qilinadi!",
    ALREADY_EXISTS: "Ushbu login allaqachon egallangan!",
    SERVER_ERROR: "Serverda xatolik yuz berdi!",
    OPERATION_FAILED: "Amal bajarilmadi!",
    OPERATION_SUCCESS: "Amal muvaffaqiyatli bajarildi!",
    LOADING: "Yuklanmoqda...",
    SAVING: "Saqlanmoqda...",
    UPLOADING: "Yuklanmoqda...",
    NO_DATA: "Ma'lumot mavjud emas!",
    DELETE_CONFIRM: "Ushbu ma'lumotni o'chirmoqchimisiz?",
};

export const ROLES: Record<Role, string> = {
    ADMIN: "ADMIN",
    VIEWER: "NAZORATCHI",
}

export const CLIENT_STATUSES: Record<ClientStatus, string> = {
    CLEAR: "OK",
    OWED: "MAN QARZ",
    DEBT: "QARZI BOR",
}

export const CLIENT_TYPES: Record<ClientType, string> = {
    BIG: "Katta qarzdor",
    DAILY: "Kunlik qarzdor"
}

export const CLIENT_STATUS_COLORS: Record<ClientStatus, string> = {
    CLEAR: "text-white bg-green-600",
    OWED: "text-white bg-blue-600",
    DEBT: "text-white bg-orange-600",
}

export const CLIENT_TYPE_COLORS: Record<ClientType, string> = {
    BIG: "text-white bg-green-600",
    DAILY: "text-white bg-blue-600",
}

export const PAYMENT_METHODS: Record<PaymentMethod, string> = {
    CASH: "NAQD PUL",
    NOTARY: "NOTARIUS",
    CARD: "KARTA ORQALI",
    INSURANCE: "SUG'URTA",
    TRANSFER: "PUL O'TKAZMA",
}

export const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
    CASH: "bg-[#C17837]",
    NOTARY: "bg-[#5A4D68]",
    CARD: "bg-[#1F7A6D]",
    INSURANCE: "bg-[#C29E4A]",
    TRANSFER: "bg-[#1B3642]",
}

export const USER_HEADERS = [
    { title: 'Login', key: 'username', sorting: true },
    { title: "Roli", key: 'role', sorting: false },
    { title: "Kiritilgan sanasi", key: 'created_at', sorting: true },
    { title: "Oxirgi kirgan vaqti", key: 'last_login', sorting: false },
    { title: 'Boshqarish', key: 'actions', sorting: false, class: "text-right" },
]

export const CLIENT_HEADERS = [
    { title: 'Ismi', key: 'name', sorting: true },
    { title: 'Telefon Raqami', key: 'phone', sorting: false },
    { title: "Mablag'i", key: 'balance', sorting: true },
    // { title: "Qarzdorligi", key: 'debt', sorting: false },
    { title: "Holati", key: 'status', sorting: false },
    { title: "Turi", key: 'type', sorting: false },
    { title: 'Boshqarish', key: 'actions', sorting: false, class: "text-right" },
]

export const INCOME_HEADERS = [
    { title: 'Sana', key: 'date', sorting: true },
    { title: 'Summasi', key: 'amount', sorting: true },
    { title: 'Valyuta kursi', key: 'currency', sorting: false },
    { title: "To'lov turi", key: 'method', sorting: false },
    { title: 'Boshqarish', key: 'actions', sorting: false, class: "text-right" },
]

export const PURCHASE_HEADERS = [
    { title: 'Sana', key: 'date', sorting: true },
    // { title: 'Valyuta kursi', key: 'currency', sorting: false },
    { title: 'Qop', key: 'sack_num', sorting: false },
    { title: "Qop narxi", key: 'sack_price', sorting: true },
    { title: "Sochma", key: 'scatter_num', sorting: false },
    { title: 'Sochma narxi', key: 'scatter_price', sorting: true },
    { title: 'Summasi', key: 'sum_price', sorting: true },
    { title: 'Mashina xarajati', key: 'car_cost', sorting: true },
    { title: 'Olgan naqd puli', key: 'other_cost', sorting: true },
    { title: 'Jami summasi', key: 'total_price', sorting: true },
    { title: 'Boshqarish', key: 'actions', sorting: false, class: "text-right" },
]

export const LINKS = [
    { title: "Mijozlar", url: "/", icon: Users, access: ["VIEWER", "ADMIN"] },
    { title: "Foydalanuvchilar", url: "/users", icon: Shield, access: ["ADMIN"] },
    { title: "Sozlamalar", url: "/settings", icon: Settings, access: ["ADMIN"] },
]