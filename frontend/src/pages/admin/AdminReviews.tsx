import { useEffect, useState } from 'react'
import { Trash2, Check } from 'lucide-react'
import { PageHeader, Card, Table, Row, Cell } from './shared'
import { TableRowsSkeleton } from '@/components/ui/Skeleton'
import Rating from '@/components/ui/Rating'
import { useToast } from '@/context/ToastContext'
import { adminApi } from '@/api/services'
import { apiMessage } from '@/api/error'

interface ReviewRow {
  id: number
  author: string
  avatar: string
  rating: number
  date: string
  title: string
  content: string
  approved: boolean
  /** Sản phẩm + biến thể được đánh giá — admin cần biết đang duyệt cho món nào */
  product: string
  variant: string
}

export default function AdminReviews() {
  // UC-31: đánh giá thật từ database
  const [list, setList] = useState<ReviewRow[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const reload = () =>
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
            title: r.title ?? '',
            content: r.content,
            approved: r.approved,
            product: r.product.name,
            variant: `${r.variant.color} / ${r.variant.size}`,
          })),
        ),
      )
      .catch((err) => toast(apiMessage(err, 'Không tải được đánh giá'), 'error'))

  useEffect(() => {
    reload().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <PageHeader title="Quản lý đánh giá" subtitle={`${list.filter((r) => !r.approved).length} đánh giá chờ duyệt`} />

      <Card>
        <Table head={['Khách hàng', 'Sản phẩm', 'Đánh giá', 'Nội dung', 'Ngày', 'Trạng thái', '']}>
          {loading && <TableRowsSkeleton cols={7} />}
          {list.map((r) => (
            <Row key={r.id}>
              <Cell>
                <div className="flex items-center gap-3">
                  <img src={r.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                  <span className="font-medium whitespace-nowrap dark:text-white">{r.author}</span>
                </div>
              </Cell>
              {/* Thiếu cột này thì admin duyệt "mù" — không biết đánh giá thuộc sản phẩm nào */}
              <Cell className="max-w-52">
                <p className="line-clamp-1 font-medium dark:text-white">{r.product}</p>
                <p className="text-xs text-slate-400">{r.variant}</p>
              </Cell>
              <Cell><Rating value={r.rating} size={13} /></Cell>
              <Cell className="max-w-72">
                {r.title && <p className="line-clamp-1 font-medium dark:text-white">{r.title}</p>}
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
                        adminApi
                          .approveReview(r.id)
                          .then(() => toast('Đã duyệt đánh giá ✓'))
                          // Duyệt hỏng thì trả về "Chờ duyệt", không để nhãn xanh sai
                          .catch((err) => {
                            setList((l) => l.map((x) => (x.id === r.id ? { ...x, approved: false } : x)))
                            toast(apiMessage(err, 'Duyệt đánh giá thất bại'), 'error')
                          })
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
                      adminApi
                        .deleteReview(r.id)
                        .then(() => toast('Đã xóa đánh giá', 'info'))
                        .catch((err) => {
                          reload()
                          toast(apiMessage(err, 'Xóa đánh giá thất bại'), 'error')
                        })
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
