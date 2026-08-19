import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Mail, Lock, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout'
import FormField from '@/components/ui/FormField'
import Button from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { authApi } from '@/api/services'
import { apiMessage } from '@/api/error'

const STEPS = ['Email', 'Mã OTP', 'Mật khẩu mới']
const RESEND_SECONDS = 60 // trùng cooldown phía backend — bấm sớm hơn cũng chỉ nhận 429

export default function ForgotPassword() {
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  // resetToken nhận từ bước OTP, dùng cho bước đặt mật khẩu — chỉ sống trong state, không lưu localStorage
  const [resetToken, setResetToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const { toast } = useToast()
  const navigate = useNavigate()

  // Đếm ngược nút "Gửi lại mã"
  useEffect(() => {
    if (countdown <= 0) return
    const t = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(t)
  }, [countdown])

  const sendEmail = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast('Vui lòng nhập email hợp lệ', 'warning')
      return
    }
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      toast('Nếu email đã đăng ký, mã OTP sẽ được gửi tới hộp thư')
      setCountdown(RESEND_SECONDS)
      setStep(1)
    } catch (err) {
      toast(apiMessage(err, 'Không gửi được mã, vui lòng thử lại'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const resendOtp = async () => {
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      toast('Đã gửi lại mã OTP')
      setCountdown(RESEND_SECONDS)
      setOtp(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    } catch (err) {
      toast(apiMessage(err, 'Không gửi được mã, vui lòng thử lại'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const onOtpChange = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return
    const next = [...otp]
    next[i] = v
    setOtp(next)
    if (v && i < 5) inputs.current[i + 1]?.focus()
  }

  const verifyOtp = async () => {
    const code = otp.join('')
    if (code.length < 6) {
      toast('Vui lòng nhập đủ 6 số', 'warning')
      return
    }
    setLoading(true)
    try {
      const { resetToken: token } = await authApi.verifyOtp(email, code)
      setResetToken(token)
      toast('Xác thực thành công')
      setStep(2)
    } catch (err) {
      toast(apiMessage(err, 'Mã không đúng hoặc đã hết hạn'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async () => {
    if (pw.length < 8) { toast('Mật khẩu tối thiểu 8 ký tự', 'warning'); return }
    if (pw !== confirm) { toast('Mật khẩu nhập lại không khớp', 'error'); return }
    setLoading(true)
    try {
      await authApi.resetPassword(resetToken, pw)
      setStep(3)
    } catch (err) {
      // resetToken hết hạn (10 phút) → phải xin OTP mới, quay về bước đầu
      toast(apiMessage(err, 'Không đặt lại được mật khẩu'), 'error')
      setLoading(false)
      return
    }
    setLoading(false)
  }

  return (
    <AuthLayout
      image="https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=1400&q=80"
      quote="Sự đơn giản là đỉnh cao của tinh tế."
      author="— Leonardo da Vinci"
    >
      {step < 3 ? (
        <>
          <h1 className="title-panel dark:text-white">Quên mật khẩu</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {step === 0 && 'Nhập email đã đăng ký để nhận mã xác thực.'}
            {step === 1 && `Nhập mã 6 số đã gửi tới ${email}`}
            {step === 2 && 'Tạo mật khẩu mới cho tài khoản của bạn.'}
          </p>

          {/* Progress */}
          <div className="mt-6 flex gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex-1">
                <div className={`h-1 rounded-full transition-colors duration-500 ${i <= step ? 'bg-accent' : 'bg-slate-200 dark:bg-white/10'}`} />
                <p className={`mt-1.5 text-[10px] tracking-wider uppercase ${i <= step ? 'font-semibold text-accent-dark' : 'text-slate-400'}`}>{s}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div key="s0" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-5">
                  <FormField
                    label="Email"
                    type="email"
                    placeholder="ban@email.com"
                    icon={<Mail size={16} />}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button size="lg" className="w-full" onClick={sendEmail} disabled={loading}>
                    {loading ? 'Đang gửi...' : 'Gửi mã xác thực'}
                  </Button>
                </motion.div>
              )}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-6">
                  <div className="flex justify-between gap-2">
                    {otp.map((d, i) => (
                      <motion.input
                        key={i}
                        ref={(el) => { inputs.current[i] = el }}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        value={d}
                        onChange={(e) => onOtpChange(i, e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Backspace' && !d && i > 0) inputs.current[i - 1]?.focus() }}
                        maxLength={1}
                        inputMode="numeric"
                        className="h-14 w-12 rounded-input border border-slate-200 bg-white text-center font-display text-xl font-semibold outline-none transition-all focus:border-accent focus:shadow-lg focus:shadow-accent/15 dark:border-white/15 dark:bg-zinc-900 dark:text-white"
                      />
                    ))}
                  </div>
                  <Button size="lg" className="w-full" onClick={verifyOtp} disabled={loading}>
                    <KeyRound size={15} /> {loading ? 'Đang kiểm tra...' : 'Xác thực'}
                  </Button>
                  <p className="text-center text-sm text-slate-400">
                    Không nhận được mã?{' '}
                    {countdown > 0 ? (
                      <span className="font-medium text-slate-400">Gửi lại sau {countdown}s</span>
                    ) : (
                      <button
                        className="link-underline cursor-pointer font-medium text-accent-dark disabled:opacity-50"
                        onClick={resendOtp}
                        disabled={loading}
                      >
                        Gửi lại
                      </button>
                    )}
                  </p>
                </motion.div>
              )}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                  <FormField label="Mật khẩu mới" type="password" placeholder="Tối thiểu 8 ký tự" icon={<Lock size={16} />} value={pw} onChange={(e) => setPw(e.target.value)} />
                  <FormField label="Nhập lại mật khẩu" type="password" placeholder="••••••••" icon={<Lock size={16} />} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                  <Button size="lg" className="w-full" onClick={resetPassword} disabled={loading}>
                    {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link to="/dang-nhap" className="mt-8 flex items-center justify-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-ink dark:text-slate-400 dark:hover:text-white">
            <ArrowLeft size={15} /> Quay lại đăng nhập
          </Link>
        </>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="py-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.15 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10 text-success"
          >
            <CheckCircle2 size={38} />
          </motion.div>
          <h2 className="title-card mt-6 dark:text-white">Đặt lại mật khẩu thành công</h2>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.</p>
          <Button size="lg" className="mt-8 w-full" onClick={() => navigate('/dang-nhap')}>Đăng nhập ngay</Button>
        </motion.div>
      )}
    </AuthLayout>
  )
}
