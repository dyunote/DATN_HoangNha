import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ShoppingBag, Trash2 } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { formatVND } from '@/data'
import QuantityStepper from '@/components/ui/QuantityStepper'
import Button from '@/components/ui/Button'

export default function CartDrawer() {
  const { items, drawerOpen, setDrawerOpen, remove, updateQuantity, subtotal } = useCart()

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-ink/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 z-[85] flex w-full max-w-md flex-col bg-white shadow-2xl dark:bg-zinc-950"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-white/5">
              <h3 className="font-display text-xl font-medium dark:text-white">
                Giỏ hàng <span className="text-sm text-slate-400">({items.length})</span>
              </h3>
              <button
                onClick={() => setDrawerOpen(false)}
                className="cursor-pointer text-slate-400 transition-all hover:rotate-90 hover:text-ink dark:hover:text-white"
                aria-label="Đóng"
              >
                <X size={22} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-accent-dark"
                >
                  <ShoppingBag size={30} />
                </motion.div>
                <p className="font-display text-xl dark:text-white">Giỏ hàng trống</p>
                <p className="text-sm text-slate-400">Hãy khám phá bộ sưu tập mới nhất của chúng tôi.</p>
                <Link to="/danh-muc" onClick={() => setDrawerOpen(false)}>
                  <Button>Mua sắm ngay</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.div
                        key={`${item.product.id}-${item.size}-${item.color}`}
                        layout
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40, height: 0 }}
                        className="flex gap-4"
                      >
                        <Link to={`/san-pham/${item.product.id}`} onClick={() => setDrawerOpen(false)}>
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="h-24 w-20 rounded-2xl object-cover"
                          />
                        </Link>
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium dark:text-white">{item.product.name}</p>
                            <button
                              onClick={() => remove(item.product.id, item.size, item.color)}
                              className="cursor-pointer text-slate-300 transition-colors hover:text-danger"
                              aria-label="Xóa"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {item.color} / {item.size}
                          </p>
                          <div className="mt-auto flex items-center justify-between">
                            <QuantityStepper
                              small
                              value={item.quantity}
                              onChange={(v) => updateQuantity(item.product.id, item.size, item.color, v)}
                            />
                            <span className="text-sm font-semibold dark:text-white">
                              {formatVND((item.unitPrice ?? item.product.price) * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="space-y-4 border-t border-slate-100 px-6 py-6 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Tạm tính</span>
                    <span className="font-display text-xl font-semibold dark:text-white">{formatVND(subtotal)}</span>
                  </div>
                  <p className="text-xs text-slate-400">Phí vận chuyển được tính ở bước thanh toán.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Link to="/gio-hang" onClick={() => setDrawerOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Xem giỏ hàng
                      </Button>
                    </Link>
                    <Link to="/thanh-toan" onClick={() => setDrawerOpen(false)}>
                      <Button className="w-full">Thanh toán</Button>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
