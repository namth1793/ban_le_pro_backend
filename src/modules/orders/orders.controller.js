const ordersService = require('./orders.service');

class OrdersController {
  async create(req, res, next) {
    try {
      const order = await ordersService.create(req.body, req.shopId, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Tạo đơn hàng thành công',
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const result = await ordersService.getAll(req.shopId, req.query);
      res.json({
        success: true,
        data: result.orders,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const order = await ordersService.getById(req.params.id, req.shopId);
      if (!order) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
      }
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const order = await ordersService.updateStatus(
        req.params.id, 
        req.shopId, 
        req.body.status
      );
      res.json({
        success: true,
        message: 'Cập nhật trạng thái thành công',
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  async getTodayStats(req, res, next) {
    try {
      const stats = await ordersService.getTodayStats(req.shopId);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrdersController();