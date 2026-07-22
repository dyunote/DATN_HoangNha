import { useEffect, useState } from 'react'
import { Trash2, Check } from 'lucide-react'
import { REVIEWS } from '@/data'
import { PageHeader, Card, Table, Row, Cell } from './shared'
import Rating from '@/components/ui/Rating'
import { useToast } from '@/context/ToastContext'
import { adminApi } from '@/api/services'

export default function AdminReviews() {
  // UC-31: đánh giá thật từ backend, fallback mock
  const [list, setList] = useState(REVIEWS.map((r, i) => ({ ...r, approved: i < 3 })))
  const { toast } = useToast()

  useEffect(() => {
    adminApi
      .reviews()
      .then((data) =>
        setList(
          data.map((r) => ({
            id: r.id,
            author: r.user.name,
            avatar: r.user.avatar ?? 'https://i.pravatar.cc/100?img=1',
            rating: r.rating,
            date: new Date(r.createdAt).toLocaleDateString('vi-VN'),
            title: '',
            content: r.content,
            approved: r.approved,
          })),
        ),
      )
      .catch(() => {})
  }, [])

  return (
    <div>
      <PageHeader title="Quản lý đánh giá" subtitle={`${list.filter((r) => !r.approved).length} đánh giá chờ duyệt`} />

      <Card>
        <Table head={['Khách hàng', 'Đánh giá', 'Nội dung', 'Ngày', 'Trạng thái', '']}>
          {list.map((r) => (
            <Row key={r.id}>
              <Cell>
                <div className="flex items-center gap-3">
                  <img src={r.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                  <span className="font-medium whitespace-nowrap dark:text-white">{r.author}</span>
                </div>
              </Cell>
              <Cell><Rating value={r.rating} size={13} /></Cell>
              <Cell className="max-w-72">
                <p className="line-clamp-2 text-slate-500 dark:text-slate-400">{r.content}</p>
              </Cell>
              <Cell className="whitespace-nowrap text-slate-500 dark:text-slate-400">{r.date}</Cell>
              <Cell>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${r.approved ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                  {r.approved ? 'Đã duyệt' : 'Chờ duyệt'}
                </span>
              </Cell>
              <Cell>
                <div className="flex justify-end gap-1">
                  {!r.approved && (
                    <button
                      onClick={() => {
                        setList((l) => l.map((x) => (x.id === r.id ? { ...x, approved: true } : x)))
                        adminApi.approveReview(r.id).catch(() => {})
                        toast('Đã duyệt đánh giá ✓')
                      }}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-success/10 hover:text-success"
                      aria-label="Duyệt"
                    >
                      <Check size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setList((l) => l.filter((x) => x.id !== r.id))
                      adminApi.deleteReview(r.id).catch(() => {})
                      toast('Đã xóa đánh giá', 'info')
                    }}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-danger/10 hover:text-danger"
                    aria-label="Xóa"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </Cell>
            </Row>
          ))}
        </Table>
      </Card>
    </div>
  )
}
