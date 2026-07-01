import InfoPage from './InfoPage';

export default function ReturnsPage() {
  return (
    <InfoPage eyebrow="Hỗ trợ" title="Chính sách đổi hàng">
      <p>Hoàng Nha hỗ trợ đổi sản phẩm trong <strong className="text-ink">7 ngày</strong> kể từ ngày nhận hàng, với điều kiện:</p>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Sản phẩm còn nguyên tem mác, chưa qua sử dụng, chưa giặt.</li>
        <li>Có hóa đơn hoặc mã đơn hàng hợp lệ.</li>
        <li>Không áp dụng đổi với sản phẩm khuyến mãi trên 50% (trừ lỗi từ nhà sản xuất).</li>
      </ul>
      <p>
        Để yêu cầu đổi hàng, vui lòng liên hệ hotline <span className="text-accent">0979 026 169</span> hoặc
        mang sản phẩm tới cửa hàng gần nhất. Phí vận chuyển đổi hàng do khách chịu, trừ trường hợp lỗi từ Hoàng Nha.
      </p>
    </InfoPage>
  );
}
