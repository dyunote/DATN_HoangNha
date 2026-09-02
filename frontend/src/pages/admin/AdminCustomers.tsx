import { useEffect, useState } from 'react'
import { Eye } from 'lucide-react'
import { PageHeader, SearchBox, Card, Table, Row, Cell } from './shared'
import { TableRowsSkeleton } from '@/components/ui/Skeleton'
import ErrorState from '@/components/ui/ErrorState'
import Modal from '@/components/ui/Modal'
import { apiMessage } from '@/api/error'
import { formatVND } from '@/data'
import { adminApi } from '@/api/services'
import { tierOf, TIER_CLS, type Tier } from '@/lib/tier'

interface CustomerRow {
  id: number
  name: string
  email: string
  avatar: string
  orders: number
  spent: number
  joined: string
  tier: Tier
}

export default function AdminCustomers() {
  const [q, setQ] = useState('')
  // UC-28: khách hàng thật từ database
  const [list, setList] = useState<CustomerRow[]>([])
  const [selected, setSelected] = useState<CustomerRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [retrying, setRetrying] = useState(false)

  /**
   * BUG CŨ: `.catch(() => {})` nuốt sạch lỗi — API hỏng là trang khách hàng
   * trắng vĩnh viễn, không một dòng giải thích. Giờ lỗi được hiện ra kèm nút
   * thử lại.
   */
  const load = async () => {
    setLoadError('')
    try {
      const data = await adminApi.customers()
      setList(
        data.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          avatar: c.avatar ?? `https://i.pravatar.cc/80?u=${c.email}`,
          orders: c.orderCount,
          spent: c.spent,
          joined: new Date(c.joined).toLocaleDateString('vi-VN'),
          tier: tierOf(c.spent),
        })),
      )
    } catch (err) {
      setLoadError(apiMessage(err, 'Không tải được danh sách khách hàng'))
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const retry = async () => {
    setRetrying(true)
    await load()
    setRetrying(false)
  }

  const filtered = list.filter((c) => (c.name + c.email).toLowerCase().includes(q.toLowerCase()))

  return (
    <div>
      <PageHeader title="Khách hàng" subtitle={`${list.length} khách hàng đang hoạt động`}>
        <SearchBox value={q} onChange={setQ} placeholder="Tìm khách hàng..." />
      </PageHeader>

      {loadError && <ErrorState message={loadError} onRetry={retry} retrying={retrying} className="mb-4" />}

      <Card>
        <Table head={['Khách hàng', 'Hạng', 'Đơn hàng', 'Tổng chi tiêu', 'Tham gia', '']}>
          {loading && <TableRowsSkeleton cols={6} />}
          {filtered.map((c) => (
            <Row key={c.id}>
              <Cell>
                <div className="flex items-center gap-3">
                  <img src={c.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                  <div>
                    <p className="font-medium dark:text-white">{c.name}</p>
                    <p className="text-[11px] text-muted">{c.email}</p>
                  </div>
                </div>
              </Cell>
              <Cell>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${TIER_CLS[c.tier]}`}>{c.tier}</span>
              </Cell>
              <Cell className="tabular-nums dark:text-white">{c.orders}</Cell>
              <Cell className="font-medium tabular-nums dark:text-white">{formatVND(c.spent)}</Cell>
              <Cell className="text-slate-500 dark:text-slate-400">{c.joined}</Cell>
              <Cell>
                <button
                  onClick={() => setSelected(c)}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-slate-100 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
                  aria-label="Xem"
                >
                  <Eye size={15} />
                </button>
              </Cell>
            </Row>
          ))}
        </Table>
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} maxWidth="max-w-md" label="Chi tiết khách hàng">
        {selected && (
          <div className="p-8 text-center">
            <img src={selected.avatar} alt="" className="mx-auto h-20 w-20 rounded-full object-cover ring-4 ring-accent/30" />
            <h3 className="title-card mt-4 dark:text-white">{selected.name}</h3>
            <p className="text-sm text-muted">{selected.email}</p>
            <span className={`mt-3 inline-block rounded-full px-3 py-1 text-[11px] font-bold ${TIER_CLS[selected.tier]}`}>
              Hạng {selected.tier}
            </span>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { v: selected.orders, l: 'Đơn hàng' },
                { v: formatVND(selected.spent), l: 'Chi tiêu' },
                { v: selected.joined, l: 'Tham gia' },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                  <p className="text-sm font-bold dark:text-white">{s.v}</p>
                  <p className="mt-1 text-[10px] tracking-wider text-muted uppercase">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
