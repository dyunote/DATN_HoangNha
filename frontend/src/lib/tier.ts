/**
 * Hạng thành viên tính theo tổng chi tiêu (đơn đã hủy không tính).
 * Dùng chung cho trang tài khoản và trang quản trị để không lệch nhau.
 */
export type Tier = 'Member' | 'Silver' | 'Gold' | 'Platinum'

/** Mốc chi tiêu tối thiểu (VND) của từng hạng */
export const TIER_MIN_SPENT: Record<Tier, number> = {
  Member: 0,
  Silver: 8_000_000,
  Gold: 15_000_000,
  Platinum: 30_000_000,
}

export const tierOf = (spent: number): Tier =>
  spent >= TIER_MIN_SPENT.Platinum
    ? 'Platinum'
    : spent >= TIER_MIN_SPENT.Gold
      ? 'Gold'
      : spent >= TIER_MIN_SPENT.Silver
        ? 'Silver'
        : 'Member'

/** Tổng chi tiêu từ danh sách đơn — bỏ đơn đã hủy, khớp với API /admin/customers */
export const spentOfOrders = (orders: { total: number; status: string }[]) =>
  orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)

export const TIER_LABEL: Record<Tier, string> = {
  Member: 'Thành viên',
  Silver: 'Thành viên Silver',
  Gold: 'Thành viên Gold',
  Platinum: 'Thành viên Platinum',
}

export const TIER_CLS: Record<Tier, string> = {
  Platinum: 'bg-ink text-accent dark:bg-white dark:text-ink',
  Gold: 'bg-accent/20 text-accent-dark',
  Silver: 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300',
  Member: 'bg-slate-50 text-muted dark:bg-white/5',
}
