import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  icon?: React.ReactNode
}

const FormField = forwardRef<HTMLInputElement, Props>(({ label, error, icon, type, className = '', ...rest }, ref) => {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className={className}>
      <label className="mb-2 block text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
        {label}
      </label>
      <div className="relative">
        {icon && <span className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400">{icon}</span>}
        <input
          ref={ref}
          type={isPassword ? (show ? 'text' : 'password') : type}
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
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>}
    </div>
  )
})

FormField.displayName = 'FormField'
export default FormField
