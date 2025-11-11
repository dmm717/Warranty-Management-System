# Tích hợp API Giao Hàng Nhanh (GHN) - Hướng dẫn sử dụng

## 📦 Tổng quan

Hệ thống đã được tích hợp API Giao Hàng Nhanh (GHN) để EVM Staff có thể tạo và quản lý đơn giao hàng phụ tùng đến các chi nhánh Service Center.

## 🚀 Cài đặt

### 1. Cấu hình API Keys

1. Copy file `.env.example` thành `.env`:
```bash
cp .env.example .env
```

2. Đăng ký tài khoản GHN tại: https://5sao.ghn.vn/

3. Lấy Token và Shop ID:
   - Đăng nhập vào tài khoản GHN
   - Vào **Cài đặt** → **Tài khoản**
   - Copy **Token** và **Shop ID**

4. Cập nhật file `.env`:
```env
VITE_GHN_TOKEN=your_actual_token_here
VITE_GHN_SHOP_ID=your_actual_shop_id_here
```

### 2. Khởi động ứng dụng

```bash
npm install
npm run dev
```

## 👥 Quyền truy cập

Chức năng giao hàng GHN chỉ dành cho **EVM_STAFF**

## ✨ Tính năng

### 1. Xem danh sách yêu cầu chờ giao hàng
- Hiển thị các yêu cầu phụ tùng đã được duyệt (status: APPROVED)
- Xem thông tin chi tiết: tên phụ tùng, số lượng, chi nhánh SC

### 2. Tạo đơn giao hàng
**Bước 1: Nhập thông tin người nhận**
- Tên người nhận
- Số điện thoại
- Địa chỉ chi tiết
- Chọn Tỉnh/Thành phố, Quận/Huyện, Phường/Xã
- Ghi chú (tùy chọn)

**Bước 2: Xác nhận và chọn dịch vụ**
- Xem lại thông tin người nhận
- Chọn dịch vụ vận chuyển
- Xem phí vận chuyển dự kiến
- Xem thời gian giao hàng dự kiến

### 3. Quản lý đơn hàng
**Tabs quản lý:**
- **Chờ lấy hàng**: Đơn hàng đang chờ shipper đến lấy
- **Đang giao**: Đơn hàng đang được vận chuyển
- **Hoàn thành**: Đơn hàng đã giao/đã hủy/hoàn trả

**Thao tác:**
- 👁️ **Chi tiết**: Xem thông tin chi tiết đơn hàng và lịch sử trạng thái
- 🔄 **Cập nhật**: Đồng bộ trạng thái mới nhất từ GHN
- 🖨️ **In**: In phiếu giao hàng (A5)
- ❌ **Hủy**: Hủy đơn hàng (chỉ đơn chưa lấy hàng)

### 4. Theo dõi trạng thái
Hệ thống hiển thị các trạng thái:
- **Chờ lấy hàng**: Đơn mới tạo
- **Đang lấy hàng**: Shipper đang đến lấy
- **Đã lấy hàng**: Đã nhận hàng từ kho
- **Đang giao**: Đang vận chuyển đến người nhận
- **Đã giao**: Giao hàng thành công
- **Đã hủy**: Đơn hàng bị hủy
- **Hoàn trả**: Giao thất bại, hoàn về kho

## 📁 Cấu trúc Files

```
src/
├── components/
│   └── Shipping/
│       ├── ShippingManagement.jsx          # Component chính
│       ├── CreateShippingOrderModal.jsx    # Modal tạo đơn
│       └── ShippingOrderDetail.jsx         # Modal chi tiết đơn
├── services/
│   └── GHNService.js                       # Service tích hợp GHN API
└── styles/
    ├── ShippingManagement.css
    ├── CreateShippingOrderModal.css
    └── ShippingOrderDetail.css
```

## 🔧 GHN API Endpoints đã tích hợp

| Endpoint | Mô tả |
|----------|-------|
| `/master-data/province` | Lấy danh sách tỉnh/thành phố |
| `/master-data/district` | Lấy danh sách quận/huyện |
| `/master-data/ward` | Lấy danh sách phường/xã |
| `/v2/shipping-order/available-services` | Lấy dịch vụ vận chuyển khả dụng |
| `/v2/shipping-order/fee` | Tính phí vận chuyển |
| `/v2/shipping-order/leadtime` | Tính thời gian dự kiến |
| `/v2/shipping-order/create` | Tạo đơn hàng |
| `/v2/shipping-order/detail` | Lấy chi tiết đơn hàng |
| `/v2/a5/gen-token` | Lấy token in phiếu |
| `/v2/switch-status/cancel` | Hủy đơn hàng |

## 💾 Lưu trữ dữ liệu

- Đơn hàng được lưu trong **localStorage** với key: `ghn_shipping_orders`
- Mỗi đơn hàng bao gồm:
  - Thông tin từ GHN API
  - Thông tin yêu cầu phụ tùng
  - Metadata (người tạo, thời gian tạo)

## 🌐 Môi trường

### Development (mặc định)
- Base URL: `https://dev-online-gateway.ghn.vn/shiip/public-api`
- Dùng cho testing

### Production
Để chuyển sang production, cập nhật trong `GHNService.js`:
```javascript
const GHN_API_BASE_URL = 'https://online-gateway.ghn.vn/shiip/public-api';
```

## 📝 Lưu ý quan trọng

1. **Bảo mật Token**: 
   - Không commit file `.env` vào git
   - File `.env` đã được thêm vào `.gitignore`

2. **Địa chỉ người gửi (EVM)**:
   - Mặc định: Quận 9, TP.HCM
   - Có thể thay đổi trong `CreateShippingOrderModal.jsx`

3. **Phí vận chuyển**:
   - Mặc định: Người gửi trả phí (paymentTypeId = 1)
   - Có thể thay đổi thành người nhận trả phí (paymentTypeId = 2)

4. **Kích thước hàng**:
   - Mặc định: 20cm x 20cm x 10cm, 500g
   - Có thể điều chỉnh theo từng đơn hàng

## 🐛 Xử lý lỗi

Các lỗi phổ biến:

1. **Token không hợp lệ**
   - Kiểm tra lại token trong file `.env`
   - Đảm bảo token chưa hết hạn

2. **Shop ID không đúng**
   - Xác nhận lại Shop ID từ tài khoản GHN

3. **Không tính được phí ship**
   - Kiểm tra địa chỉ người nhận có đầy đủ không
   - Đảm bảo đã chọn đủ Tỉnh/Quận/Phường

## 📞 Hỗ trợ

- GHN API Documentation: https://api.ghn.vn/home/docs/detail
- GHN Support: https://ghn.vn/pages/lien-he

## 🎯 Roadmap

- [ ] Tích hợp webhook để tự động cập nhật trạng thái
- [ ] Thêm thống kê chi phí vận chuyển
- [ ] Xuất báo cáo giao hàng
- [ ] Tích hợp với backend để lưu trữ dữ liệu
- [ ] Thêm tính năng giao hàng hàng loạt
