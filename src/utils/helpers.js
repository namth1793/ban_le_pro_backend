const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `HD${year}${month}${day}${random}`;
};

const generateProductCode = async (shopId) => {
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `SP${random}`;
};

const generateCustomerCode = async (shopId) => {
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `KH${random}`;
};

const calculateLoyaltyPoints = (amount) => {
  // 1 điểm cho mỗi 10,000 VND
  return Math.floor(amount / 10000);
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

const formatDate = (date) => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

module.exports = {
  generateOrderNumber,
  generateProductCode,
  generateCustomerCode,
  calculateLoyaltyPoints,
  formatCurrency,
  formatDate
};