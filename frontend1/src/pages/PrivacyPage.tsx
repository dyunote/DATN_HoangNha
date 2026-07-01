import InfoPage from './InfoPage';

export default function PrivacyPage() {
  return (
    <InfoPage eyebrow="Pháp lý" title="Chính sách bảo mật">
      <p>
        Hoàng Nha cam kết bảo vệ thông tin cá nhân của khách hàng. Chúng tôi chỉ thu thập thông tin cần thiết
        cho việc xử lý đơn hàng và chăm sóc khách hàng.
      </p>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Thông tin thu thập: họ tên, số điện thoại, địa chỉ, email.</li>
        <li>Mục đích: xử lý đơn hàng, giao hàng, hỗ trợ và thông báo khuyến mãi (nếu bạn đồng ý).</li>
        <li>Chúng tôi không bán hoặc chia sẻ dữ liệu cho bên thứ ba vì mục đích thương mại.</li>
        <li>Bạn có quyền yêu cầu xem, sửa hoặc xóa thông tin cá nhân của mình bất cứ lúc nào.</li>
      </ul>
      <p>Mật khẩu được mã hóa và không ai (kể cả nhân viên) có thể xem được.</p>
    </InfoPage>
  );
}
