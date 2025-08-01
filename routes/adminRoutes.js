const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const { requireLogin, requireAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Áp dụng middleware kiểm tra đăng nhập và quyền admin cho toàn bộ router
router.use(requireLogin, requireAdmin);

// Trang admin chính
router.get('/', adminController.getAdminPage);

// Danh sách sản phẩm
router.get('/products', adminController.getProductList);

// Form thêm sản phẩm
router.get('/products/add', adminController.getAddProductPage);

// Xử lý thêm sản phẩm (có hình ảnh)
router.post('/products/add', upload.single('image'), adminController.handleAddProduct);
// Xóa sản phẩm
router.post('/products/delete/:id', adminController.deleteProduct);

// Sửa sản phẩm
router.get('/products/edit/:id', adminController.getEditProductPage);
router.post('/products/edit/:id', upload.single('image'), adminController.handleEditProduct);

// Nhập hàng theo sản phẩm (phải đặt trước module.exports!)
router.get('/products/import/:id', adminController.getImportPage);
router.post('/products/import/:id', adminController.handleImportProduct);

// Thống kê doanh thu
router.get('/statistics', adminController.getStatistics);

// Trang nhập hàng tổng quát (nếu có)
router.get('/import', adminController.getImportPage);
//router.post('/import', adminController.handleImportProduct);
//quản lý người dùng 
router.get('/users', adminController.getUserList);
router.post('/users/delete/:id', adminController.deleteUser);

module.exports = router;

