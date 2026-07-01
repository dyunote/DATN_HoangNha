import nodemailer from 'nodemailer';

// Transporter doc cau hinh SMTP tu .env (dung Mailtrap khi dev).
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 2525,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// Gui email chua link dat lai mat khau
export const sendResetPasswordEmail = async (to: string, resetUrl: string) => {
  await transporter.sendMail({
    from: process.env.MAIL_FROM || 'Hoang Nha <no-reply@hoangnha.com>',
    to,
    subject: 'Đặt lại mật khẩu - Hoàng Nha',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#1a1a1a;">
        <h2 style="color:#a4754f;">Đặt lại mật khẩu</h2>
        <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản Hoàng Nha.</p>
        <p>Nhấn nút bên dưới để đặt mật khẩu mới (link hiệu lực trong 30 phút):</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:10px 22px;background:#1a1a1a;color:#fff;text-decoration:none;border-radius:2px;">Đặt lại mật khẩu</a></p>
        <p style="color:#888;font-size:13px;">Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
      </div>
    `,
  });
};
