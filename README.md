# Retail SaaS Backend

Backend cho hệ thống quản lý bán lẻ (tạp hóa, nhà thuốc, cửa hàng nhỏ)

## Tính năng
- Đăng ký/đăng nhập
- Quản lý sản phẩm
- Bán hàng (POS)
- Quản lý khách hàng & tích điểm
- Báo cáo doanh thu
- Multi-tenant (nhiều cửa hàng)

## Cài đặt

1. Clone project
2. Cài dependencies: `npm install`
3. Tạo file `.env` từ `.env.example`
4. Tạo database: `npm run db:migrate`
5. Seed dữ liệu mẫu: `npm run db:seed`
6. Chạy dev: `npm run dev`

## API Endpoints

### Auth
- POST /api/auth/register - Đăng ký
- POST /api/auth/login - Đăng nhập

### Products
- GET /api/products - Danh sách sản phẩm
- POST /api/products - Thêm sản phẩm
- GET /api/products/:id - Chi tiết
- PUT /api/products/:id - Cập nhật
- DELETE /api/products/:id - Xóa

### Orders
- GET /api/orders - Danh sách đơn
- POST /api/orders - Tạo đơn
- GET /api/orders/:id - Chi tiết

### Customers
- GET /api/customers - Danh sách KH
- POST /api/customers - Thêm KH
- PUT /api/customers/:id - Cập nhật

### Reports
- GET /api/reports/daily - Báo cáo ngày
- GET /api/reports/monthly - Báo cáo tháng