import { useEffect, useState } from 'react'
import { Eye } from 'lucide-react'
import { PageHeader, SearchBox, Card, Table, Row, Cell } from './shared'
import Modal from '@/components/ui/Modal'
import { formatVND } from '@/data'
import { adminApi } from '@/api/services'

const CUSTOMERS = [
  { id: 1, name: 'Minh Anh', email: 'minhanh@gmail.com', avatar: 'https://i.pravatar.cc/80?img=47', orders: 12, spent: 18400000, joined: '03/2024', tier: 'Gold' },
  { id: 2, name: 'Thảo Nguyên', email: 'thaonguyen@gmail.com', avatar: 'https://i.pravatar.cc/80?img=32', orders: 8, spent: 9200000, joined: '07/2024', tier: 'Silver' },
  { id: 3, name: 'Quốc Bảo', email: 'quocbao@gmail.com', avatar: 'https://i.pravatar.cc/80?img=12', orders: 21, spent: 32600000, joined: '01/2023', tier: 'Platinum' },
  { id: 4, name: 'Lan Chi', email: 'lanchi@gmail.com', avatar: 'https://i.pravatar.cc/80?img=25', orders: 5, spent: 4100000, joined: '02/2026', tier: 'Member' },
  { id: 5, name: 'Hữu Phước', email: 'huuphuoc@gmail.com', avatar: 'https://i.pravatar.cc/80?img=68', orders: 15, spent: 21800000, joined: '09/2023', tier: 'Gold' },
]

const TIER_CLS: Record<string, string> = {
  Platinum: 'bg-ink text-accent dark:bg-white dark:text-ink',
  Gold: 'bg-accent/20 text-accent-dark',
  Silver: 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300',
  Member: 'bg-slate-50 text-slate-400 dark:bg-white/5',
}

const tierOf = (spent: number) =>
  spent >= 30000000 ? 'Platinum' : spent >= 15000000 ? 'Gold' : spent >= 8000000 ? 'Silver' : 'Member'

export default function AdminCustomers() {
  const [q, setQ] = useState('')
  // UC-28: khách hàng thật từ backend, fallback mock
  const [list, setList] = useState(CUSTOMERS)
  const [selected, setSelected] = useState<(typeof CUSTOMERS)[number] | null>(null)

  useEffect(() => {
    adminApi
      .customers()
      .then((data) =>
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
        ),
      )
      .catch(() => {})
  }, [])

  const filtered = list.filter((c) => (c.name + c.email).toLowerCase().includes(q.toLowerCase()))

  return (
    <div>
      <PageHeader title="Khách hàng" subtitle={`${list.length} khách hàng đang hoạt động`}>
        <SearchBox value={q} onChange={setQ} placeholder="Tìm khách hàng..." />
      </PageHeader>

      <Card>
        <Table head={['Khách hàng', 'Hạng', 'Đơn hàng', 'Tổng chi tiêu', 'Tham gia', '']}>
          {filtered.map((c) => (
            <Row key={c.id}>
              <Cell>
                <div className="flex items-center gap-3">
                  <img src={c.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                  <div>
                    <p className="font-medium dark:text-white">{c.name}</p>
                    <p className="text-[11px] text-slate-400">{c.email}</p>
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
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
                  aria-label="Xem"
                >
                  <Eye size={15} />
                </button>
              </Cell>
            </Row>
          ))}
        </Table>
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} maxWidth="max-w-md">
        {selected && (
          <div className="p-8 text-center">
            <img src={selected.avatar} alt="" className="mx-auto h-20 w-20 rounded-full object-cover ring-4 ring-accent/30" />
            <h3 className="font-display mt-4 text-xl font-medium dark:text-white">{selected.name}</h3>
            <p className="text-sm text-slate-400">{selected.email}</p>
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
                  <p className="mt-1 text-[10px] tracking-wider text-slate-400 uppercase">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
