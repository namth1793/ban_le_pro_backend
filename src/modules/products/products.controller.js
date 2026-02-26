const multer = require('multer');
const productsService = require('./products.service');
const { parseImportBuffer } = require('./products.import');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /\.(csv|xlsx|xls)$/i.test(file.originalname) ||
      ['text/csv', 'application/vnd.ms-excel',
       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.mimetype);
    if (ok) cb(null, true);
    else cb(new Error('Chỉ chấp nhận file CSV hoặc Excel (.csv, .xlsx, .xls)'));
  }
});

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

  async importProducts(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn file để nhập' });
      }
      const { data, errors: parseErrors } = parseImportBuffer(req.file.buffer, req.file.originalname);
      if (data.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Không tìm thấy dữ liệu hợp lệ trong file',
          errors: parseErrors
        });
      }
      const result = await productsService.bulkCreate(data, req.shopId);
      res.json({
        success: true,
        message: `Nhập thành công ${result.created} sản phẩm`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

const controller = new ProductsController();
module.exports = controller;
module.exports.upload = upload;