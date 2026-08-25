import { useEffect, useState } from 'react'
import { isValidHex, normalizeHex } from '@/lib/color'

interface Props {
  /** Mã hex hiện tại, luôn ở dạng #RRGGBB */
  value: string
  onChange: (hex: string) => void
  /** Nhãn hiển thị phía trên (bỏ trống khi dùng trong hàng biến thể chật chỗ) */
  label?: string
  className?: string
}

/**
 * Ô chọn màu: color picker + ô gõ mã HEX thủ công, ĐỒNG BỘ HAI CHIỀU.
 *
 * Vì sao cần ô text: designer/nhà cung cấp đưa mã màu dạng "#1E3A5F", kéo
 * picker bằng chuột không bao giờ ra đúng con số đó. Ngược lại, gõ tay xong
 * thì ô màu phải đổi theo ngay để nhìn thấy màu thật.
 *
 * Ô text giữ NGUYÊN chuỗi đang gõ dở (state riêng `text`) thay vì ép ngược từ
 * `value` mỗi lần render — nếu ép, gõ tới ký tự thứ 2 là bị ghi đè, không ai
 * gõ nổi.
 */
export default function ColorInput({ value, onChange, label, className = '' }: Props) {
  const [text, setText] = useState(value)

  // Màu đổi từ BÊN NGOÀI (kéo picker, hoặc nạp lại biến thể từ DB) → đồng bộ
  // xuống ô text. Không đụng khi người dùng đang gõ dở (text hợp lệ và khớp).
  useEffect(() => {
    setText((cur) => (normalizeHex(cur) === value.toUpperCase() ? cur : value))
  }, [value])

  const invalid = text.trim() !== '' && !normalizeHex(text)

  const commit = (raw: string) => {
    const hex = normalizeHex(raw)
    // Gõ sai thì GIỮ NGUYÊN màu cũ, không đẩy chuỗi rác lên state cha
    if (hex) {
      setText(hex)
      onChange(hex)
    } else {
      setText(value)
    }
  }

  return (
    <div className={className}>
      {label && <label className="label-field mb-2 block text-slate-500 dark:text-slate-400">{label}</label>}
      <div className="flex items-center gap-2">
        <input
          type="color"
          // Picker chỉ hiểu #RRGGBB — chuỗi rác làm nó nhảy về #000000
          value={isValidHex(value) ? value : '#111111'}
          onChange={(e) => {
            const hex = e.target.value.toUpperCase()
            setText(hex)
            onChange(hex)
          }}
          className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-zinc-900"
          aria-label="Bảng chọn màu"
        />
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            // Gõ đủ và đúng thì cập nhật NGAY để ô màu đổi theo, không đợi blur
            const hex = normalizeHex(e.target.value)
            if (hex) onChange(hex)
          }}
          onBlur={(e) => commit(e.target.value)}
          placeholder="#RRGGBB"
          maxLength={7}
          spellCheck={false}
          className={`w-24 shrink-0 rounded-input border bg-white px-2.5 py-2.5 font-mono text-xs uppercase outline-none dark:bg-zinc-900 dark:text-white ${
            invalid
              ? 'border-danger focus:border-danger'
              : 'border-slate-200 focus:border-accent dark:border-white/10'
          }`}
          aria-label="Mã màu HEX"
          aria-invalid={invalid}
        />
      </div>
      {invalid && <p className="mt-1 text-[11px] font-medium text-danger">Mã màu phải có dạng #RRGGBB</p>}
    </div>
  )
}
