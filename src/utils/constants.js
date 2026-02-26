const PAYMENT_METHODS = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
  MOMO: 'Ví MoMo',
  VNPAY: 'VNPay'
};

const ORDER_STATUS = {
  PENDING: 'Chờ xử lý',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy'
};

const PRODUCT_CATEGORIES = {
  FOOD: 'Thực phẩm',
  BEVERAGE: 'Đồ uống',
  MEDICINE: 'Thuốc',
  COSMETIC: 'Mỹ phẩm',
  OTHER: 'Khác'
};

const USER_ROLES = {
  OWNER: 'Chủ cửa hàng',
  STAFF: 'Nhân viên'
};

const PLAN_TYPES = {
  FREE: 'Dùng thử',
  BASIC: 'Cơ bản',
  PREMIUM: 'Cao cấp'
};

module.exports = {
  PAYMENT_METHODS,
  ORDER_STATUS,
  PRODUCT_CATEGORIES,
  USER_ROLES,
  PLAN_TYPES
};