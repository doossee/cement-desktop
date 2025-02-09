import { toast } from 'vue-sonner'

export function createToast(message: string, type: "SUCCESS" | "WARNING") {
    toast(message, {
        style: { background: "hsl(var(--card))", color: 'white', border: 'hsl(var(--border))' },
        action: { label: "Yopish", onClick: () => {} },
        actionButtonStyle: type === "SUCCESS" ? { background: "var(--color-green-700)" } : { background: 'var(--color-orange-600)', color: 'white' },
    })
}