export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
        <div>
          <h3 className="text-white font-semibold mb-2">Hoàng Nha</h3>
          <p>Thời trang trẻ trung, năng động, giá cả hợp lý cho mọi lứa tuổi.</p>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-2">Hỗ trợ khách hàng</h3>
          <p>Hotline: 1900 0000</p>
          <p>Email: support@hoangnha.com</p>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-2">Địa chỉ</h3>
          <p>123 Đường Thời Trang, Quận 1, TP. Hồ Chí Minh</p>
        </div>
      </div>
      <div className="text-center text-xs text-gray-500 py-3 border-t border-gray-800">
        © {new Date().getFullYear()} Hoàng Nha. All rights reserved.
      </div>
    </footer>
  );
}
