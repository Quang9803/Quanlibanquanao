const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// Trang chủ => Chuyển hướng đến trang sản phẩm
router.get('/', (req, res) => res.redirect('/products'));

// Trang đăng nhập / đăng ký / đăng xuất
router.get('/login', userController.getLoginPage);
router.post('/login', userController.handleLogin);
router.get('/logout', userController.logout);
router.get('/register', userController.getRegisterPage);
router.post('/register', userController.handleRegister);

// Tìm kiếm sản phẩm
router.get('/search', userController.searchProducts);

// Danh sách sản phẩm & chi tiết sản phẩm
router.get('/products', authMiddleware.requireLogin, userController.getProductsPage);
router.get('/products/:id', authMiddleware.requireLogin, userController.getProductDetail);
router.get('/products/category/:category', authMiddleware.requireLogin, userController.getProductsByCategory);

// Giỏ hàng
router.post('/cart/add', authMiddleware.requireLogin, userController.addToCart);
router.get('/cart', authMiddleware.requireLogin, userController.viewCart);
router.get('/cart/remove/:id/:size/:color', authMiddleware.requireLogin, userController.removeFromCart);
router.get('/cart/update/:id/:size/:color/:action', authMiddleware.requireLogin, userController.updateCartQuantity);
router.post('/cart/checkout', authMiddleware.requireLogin, userController.checkoutCart);

// Đặt hàng (đơn lẻ)
//router.post('/order', authMiddleware.requireLogin, userController.placeOrder);

// Trang tài khoản cá nhân
router.get('/account', authMiddleware.requireLogin, userController.getAccountPage);
router.post('/account', authMiddleware.requireLogin, userController.updateAccountInfo);

module.exports = router;
