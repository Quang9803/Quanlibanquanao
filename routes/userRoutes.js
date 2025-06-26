const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// Trang chủ
router.get('/', userController.getHomePage);

// Đăng nhập / Đăng ký / Đăng xuất
router.get('/login', userController.getLoginPage);
router.post('/login', userController.handleLogin);
router.get('/logout', userController.logout);
router.get('/register', userController.getRegisterPage);
router.post('/register', userController.handleRegister);

// Danh sách sản phẩm & chi tiết sản phẩm
router.get('/products', authMiddleware.requireLogin, userController.getProductsPage);
router.get('/products/:id', userController.getProductDetail);

// Giỏ hàng
router.post('/cart/add', authMiddleware.requireLogin, userController.addToCart);
router.get('/cart', authMiddleware.requireLogin, userController.viewCart);
router.get('/cart/remove/:id/:size', authMiddleware.requireLogin, userController.removeFromCart);
router.get('/cart/update/:id/:size/:action', authMiddleware.requireLogin, userController.updateCartQuantity);
router.post('/cart/checkout', authMiddleware.requireLogin, userController.checkoutCart);

// Đặt hàng (đơn lẻ)
router.post('/order', authMiddleware.requireLogin, userController.placeOrder);

// Xuất router
module.exports = router;
