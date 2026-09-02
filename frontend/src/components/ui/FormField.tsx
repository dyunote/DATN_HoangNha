import { forwardRef, useId, useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  icon?: React.ReactNode
}

const FormField = forwardRef<HTMLInputElement, Props>(({ label, error, icon, type, className = '', id, ...rest }, ref) => {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'

  // Mỗi ô cần một id thật để nối nhãn với ô nhập:
  //  - bấm vào NHÃN là con trỏ nhảy vào ô (vùng bấm rộng hơn, tiện trên điện thoại)
  //  - trình đọc màn hình đọc đúng tên ô, thay vì "hộp văn bản" trống không
  // useId() sinh id duy nhất cho từng lần dùng, không sợ trùng khi một trang
  // có nhiều form.
  const autoId = useId()
  const fieldId = id ?? autoId
  const errorId = `${fieldId}-error`

  return (
    <div className={className}>
      <label htmlFor={fieldId} className="label-field mb-2 block text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <div className="relative">
        {icon && <span className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400">{icon}</span>}
        <input
          ref={ref}
          id={fieldId}
          type={isPassword ? (show ? 'text' : 'password') : type}
          // aria-invalid + aria-describedby: trình đọc màn hình báo ô đang sai
          // và đọc luôn dòng lý do bên dưới.
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`w-full rounded-input border bg-white px-4 py-3.5 text-sm transition-all duration-300 outline-none placeholder:text-slate-400 focus:shadow-lg focus:shadow-accent/10 dark:bg-zinc-900 dark:text-white ${
            icon ? 'pl-11' : ''
          } ${isPassword ? 'pr-11' : ''} ${
            error
              ? 'border-danger focus:border-danger'
              : 'border-slate-200 focus:border-accent dark:border-white/10 dark:focus:border-accent'
          }`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-slate-400 transition-colors hover:text-ink dark:hover:text-white"
            tabIndex={-1}
            aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
})

FormField.displayName = 'FormField'
export default FormField
