const customersService = require('./customers.service');

class CustomersController {
  async create(req, res, next) {
    try {
      const customer = await customersService.create(req.body, req.shopId);
      res.status(201).json({
        success: true,
        message: 'Thêm khách hàng thành công',
        data: customer
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const result = await customersService.getAll(req.shopId, req.query);
      res.json({
        success: true,
        data: result.customers,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const customer = await customersService.getById(req.params.id, req.shopId);
      if (!customer) {
        return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
      }
      res.json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const customer = await customersService.update(req.params.id, req.shopId, req.body);
      res.json({
        success: true,
        message: 'Cập nhật thông tin thành công',
        data: customer
      });
    } catch (error) {
      next(error);
    }
  }

  async addPoints(req, res, next) {
    try {
      const customer = await customersService.addPoints(
        req.params.id, 
        req.shopId, 
        req.body.points
      );
      res.json({
        success: true,
        message: 'Cộng điểm thành công',
        data: customer
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CustomersController();