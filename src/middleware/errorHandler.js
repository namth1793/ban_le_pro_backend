// src/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error(err);

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Prisma errors
  if (err.code === 'P2002') {
    statusCode = 400;
    message = 'Dữ liệu đã tồn tại';
  }

  if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Không tìm thấy dữ liệu';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token không hợp lệ';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token đã hết hạn';
  }

  res.status(statusCode).json({
    success: false,
    message: message
  });
};

module.exports = errorHandler;  // QUAN TRỌNG: export hàm, không phải object