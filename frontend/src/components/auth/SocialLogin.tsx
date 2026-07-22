import { FaGoogle, FaFacebookF, FaGithub } from 'react-icons/fa6'
import { useToast } from '@/context/ToastContext'

export default function SocialLogin() {
  const { toast } = useToast()
  const items = [
    { icon: <FaGoogle />, label: 'Google' },
    { icon: <FaFacebookF />, label: 'Facebook' },
    { icon: <FaGithub />, label: 'Github' },
  ]
  return (
    <>
      <div className="my-7 flex items-center gap-4">
        <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        <span className="text-[11px] tracking-[0.2em] text-slate-400 uppercase">Hoặc tiếp tục với</span>
        <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {items.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => toast(`Đăng nhập ${s.label} (demo)`, 'info')}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-btn border border-slate-200 py-3 text-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-ink hover:shadow-lg dark:border-white/15 dark:text-white dark:hover:border-white"
            aria-label={s.label}
          >
            {s.icon}
          </button>
        ))}
      </div>
    </>
  )
}
