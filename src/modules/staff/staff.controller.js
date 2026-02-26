const staffService = require('./staff.service');
const { catchAsync } = require('../../utils/catchAsync');

class StaffController {
  getAll = catchAsync(async (req, res) => {
    const shopId = req.shopId;
    const staff = await staffService.getAll(shopId);
    
    res.json({
      success: true,
      data: staff
    });
  });

  getAvailableUsers = catchAsync(async (req, res) => {
    const shopId = req.shopId;
    const users = await staffService.getAvailableUsers(shopId);
    
    res.json({
      success: true,
      data: users
    });
  });

  create = catchAsync(async (req, res) => {
    const shopId = req.shopId;
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin'
      });
    }

    const staff = await staffService.create(shopId, userId, role);
    
    res.status(201).json({
      success: true,
      message: 'Thêm nhân viên thành công',
      data: staff
    });
  });

  update = catchAsync(async (req, res) => {
    const { id } = req.params;
    const shopId = req.shopId;
    const updateData = req.body;

    const staff = await staffService.update(id, shopId, updateData);
    
    res.json({
      success: true,
      message: 'Cập nhật thông tin nhân viên thành công',
      data: staff
    });
  });

  delete = catchAsync(async (req, res) => {
    const { id } = req.params;
    const shopId = req.shopId;

    await staffService.delete(id, shopId);
    
    res.json({
      success: true,
      message: 'Xóa nhân viên thành công'
    });
  });
}

module.exports = new StaffController();