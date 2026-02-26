const productsService = require('./products.service');

class ProductsController {
  async create(req, res, next) {
    try {
      const product = await productsService.create(req.body, req.shopId);
      res.status(201).json({
        success: true,
        message: 'Thêm sản phẩm thành công',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const result = await productsService.getAll(req.shopId, req.query);
      res.json({
        success: true,
        data: result.products,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const product = await productsService.getById(req.params.id, req.shopId);
      if (!product) {
        return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
      }
      res.json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const product = await productsService.update(req.params.id, req.shopId, req.body);
      res.json({
        success: true,
        message: 'Cập nhật sản phẩm thành công',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await productsService.delete(req.params.id, req.shopId);
      res.json({
        success: true,
        message: 'Xóa sản phẩm thành công'
      });
    } catch (error) {
      next(error);
    }
  }

  async getLowStock(req, res, next) {
    try {
      const products = await productsService.getLowStock(req.shopId);
      res.json({ success: true, data: products });
    } catch (error) {
      next(error);
    }
  }

  async getExpiring(req, res, next) {
    try {
      const days = req.query.days || 90;
      const products = await productsService.getExpiring(req.shopId, days);
      res.json({ success: true, data: products });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductsController();