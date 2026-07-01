import InfoPage from './InfoPage';

export default function CareersPage() {
  return (
    <InfoPage eyebrow="Tuyển dụng" title="Cơ hội việc làm">
      <p>
        Hoàng Nha luôn tìm kiếm những con người yêu thời trang, cầu tiến và muốn cùng nhau xây dựng một
        thương hiệu Việt bền vững.
      </p>
      <p>Các vị trí thường tuyển: nhân viên bán hàng, thiết kế, marketing, kho vận, chăm sóc khách hàng.</p>
      <p>
        Gửi CV về email <a href="mailto:tuyendung@hoangnha.com" className="text-accent hover:text-accent-dark">tuyendung@hoangnha.com</a> —
        chúng tôi sẽ phản hồi trong vòng 5 ngày làm việc.
      </p>
    </InfoPage>
  );
}
