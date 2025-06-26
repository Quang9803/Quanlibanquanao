const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Đường dẫn đến file dữ liệu
const usersFile = path.join(__dirname, '../data/users.json');
const productsFile = path.join(__dirname, '../data/products.json');
const ordersFile = path.join(__dirname, '../data/orders.json');

// Đọc và ghi JSON
function readJSON(filePath) {
    const data = fs.readFileSync(filePath, 'utf8').trim();
    return data ? JSON.parse(data) : [];
}

function writeJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Trang chính
exports.getHomePage = (req, res) => {
    res.redirect('/products');
};

// Trang đăng nhập
exports.getLoginPage = (req, res) => {
    res.render('login', { error: null });
};

// Xử lý đăng nhập
exports.handleLogin = (req, res) => {
    const { username, password } = req.body;
    const users = readJSON(usersFile);
    const user = users.find(u => u.username === username);

    if (user && user.password === password) {
        req.session.user = user;
        req.session.cart = user.cart || [];
        return res.redirect(user.role === 'admin' ? '/admin' : '/products');
    }

    return res.render('login', { error: 'Sai tên đăng nhập hoặc mật khẩu' });
};



// Xử lý đăng xuất (lưu giỏ vào file)
exports.logout = (req, res) => {
    const users = readJSON(usersFile);
    const user = users.find(u => u.id === req.session.user.id);

    if (user) {
        user.cart = req.session.cart || [];
        writeJSON(usersFile, users);
    }

    req.session.destroy(() => {
        res.redirect('/login');
    });
};

// Trang sản phẩm
exports.getProductsPage = (req, res) => {
    const products = readJSON(productsFile);
    res.render('products', { user: req.session.user, products });
};

// Đặt hàng đơn lẻ
exports.placeOrder = (req, res) => {
    const { productId, quantity } = req.body;
    const orders = readJSON(ordersFile);
    const newOrder = {
        id: Date.now(),
        user: req.session.user.username,
        productId,
        quantity: parseInt(quantity),
        date: new Date().toISOString()
    };
    orders.push(newOrder);
    writeJSON(ordersFile, orders);
    res.redirect('/products');
};

// Trang đăng ký
exports.getRegisterPage = (req, res) => {
    res.render('register', { error: null });
};

// Xử lý đăng ký
exports.handleRegister = (req, res) => {
    const { username, password } = req.body;
    const users = readJSON(usersFile);

    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
        return res.render('register', { error: 'Tên đăng nhập đã tồn tại' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = {
        id: Date.now(),
        username,
        password: hashedPassword,
        role: 'user',
        cart: [] // 👈 Thêm giỏ hàng mặc định
    };

    users.push(newUser);
    writeJSON(usersFile, users);
    res.redirect('/login');
};

// Thêm vào giỏ hàng
exports.addToCart = (req, res) => {
    const { productId, size } = req.body;
    const products = readJSON(productsFile);
    const product = products.find(p => p.id == productId);

    if (!product) return res.redirect('/products');

    if (!req.session.cart) req.session.cart = [];

    const cart = req.session.cart;

    // Kiểm tra trùng sản phẩm + size
    const existing = cart.find(p => p.id == product.id && p.size == size);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1,
            size: size || "M" // mặc định nếu không có
        });
    }

    res.redirect('/cart');
};

// Xem giỏ hàng
exports.viewCart = (req, res) => {
    const cart = req.session.cart || [];
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    res.render('cart', { cart, total, message: null });
};

// Xóa sản phẩm khỏi giỏ
exports.removeFromCart = (req, res) => {
    const { id, size } = req.params;
    if (req.session.cart) {
        req.session.cart = req.session.cart.filter(item => !(item.id == id && item.size == size));
    }
    res.redirect('/cart');
};

// Tăng/giảm số lượng trong giỏ
exports.updateCartQuantity = (req, res) => {
    const { id, size, action } = req.params;
    const cart = req.session.cart || [];

    const item = cart.find(p => p.id == id && p.size == size);
    if (item) {
        if (action === 'increase') item.quantity += 1;
        else if (action === 'decrease') item.quantity = Math.max(1, item.quantity - 1);
    }

    res.redirect('/cart');
};


// Đặt hàng toàn bộ giỏ hàng
exports.checkoutCart = (req, res) => {
    const cart = req.session.cart || [];
    if (cart.length === 0) return res.redirect('/cart');

    const orders = readJSON(ordersFile);

    const newOrder = {
        id: Date.now(),
        userId: req.session.user.id,
        items: cart,
        date: new Date().toISOString()
    };

    orders.push(newOrder);
    writeJSON(ordersFile, orders);

    // Cập nhật lại giỏ hàng cho user trong file
    const users = readJSON(usersFile);
    const user = users.find(u => u.id === req.session.user.id);
    if (user) {
        user.cart = [];
        writeJSON(usersFile, users);
    }

    req.session.cart = [];

    res.render('cart', { cart: [], total: 0, message: 'Đặt hàng thành công!' });
};
//chi tiết sản phẩm
exports.getProductDetail = (req, res) => {
    const { id } = req.params;
    const products = readJSON(productsFile);
    const product = products.find(p => p.id == id);
    if (!product) return res.status(404).send('Không tìm thấy sản phẩm');
    res.render('product-detail', { product });
};
