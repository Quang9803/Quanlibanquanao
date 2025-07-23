const fs = require('fs');
const path = require('path');

// Đường dẫn tới các file dữ liệu
const usersFile = path.join(__dirname, '../data/users.json');
const productsFile = path.join(__dirname, '../data/products.json');
const ordersFile = path.join(__dirname, '../data/orders.json');

// Đọc/ghi JSON
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

// Đăng nhập
exports.getLoginPage = (req, res) => {
    res.render('login', { error: null, user: null });
};

exports.handleLogin = (req, res) => {
    const { username, password } = req.body;
    const users = readJSON(usersFile);
    const user = users.find(u => u.username === username);

    if (user && user.password === password) {
        req.session.user = user;
        req.session.cart = user.cart || [];
        return res.redirect(user.role === 'admin' ? '/admin' : '/products');
    }

    res.render('login', { error: 'Sai tên đăng nhập hoặc mật khẩu', user: null });
};

// Đăng xuất
exports.logout = (req, res) => {
    const users = readJSON(usersFile);
    const user = users.find(u => u.id === req.session.user?.id);

    if (user) {
        user.cart = req.session.cart || [];
        writeJSON(usersFile, users);
    }

    req.session.destroy(() => {
        res.redirect('/login');
    });
};

// Hiển thị trang sản phẩm
exports.getProductsPage = (req, res) => {
    const products = readJSON(productsFile);

    const featuredProducts = [...products].sort(() => 0.5 - Math.random()).slice(0, 8);
    const maleProducts = products.filter(p => p.category === 'Nam').slice(0, 8);
    const femaleProducts = products.filter(p => p.category === 'Nữ').slice(0, 8);
    const kidsProducts = products.filter(p => p.category === 'Trẻ em').slice(0, 8);

    res.render('products-home', {
        featuredProducts,
        maleProducts,
        femaleProducts,
        kidsProducts,
        user: req.session.user
    });
};

// Xem theo danh mục
exports.getProductsByCategory = (req, res) => {
    const category = decodeURIComponent(req.params.category);
    const products = readJSON(productsFile);

    const filtered = category === 'Sản phẩm mới'
        ? [...products].sort(() => 0.5 - Math.random()).slice(0, 20)
        : products.filter(p => p.category === category);

    res.render('products-list', {
        title: `Danh mục: ${category}`,
        categoryTitle: category,
        products: filtered,
        user: req.session.user
    });
};

// Chi tiết sản phẩm
exports.getProductDetail = (req, res) => {
    const { id } = req.params;
    const products = readJSON(productsFile);
    const product = products.find(p => p.id == id);
    if (!product) return res.status(404).send('Không tìm thấy sản phẩm');

    res.render('product-detail', {
        product,
        user: req.session.user
    });
};

// Thêm vào giỏ hàng
exports.addToCart = (req, res) => {
    const { productId, size, color, quantity } = req.body;
    const products = readJSON(productsFile);
    const product = products.find(p => p.id == productId);
    if (!product) return res.redirect('/products');

    if (!req.session.cart) req.session.cart = [];

    const existing = req.session.cart.find(p => p.id == product.id && p.size == size && p.color === color);
    if (existing) {
        existing.quantity += parseInt(quantity);
    } else {
        req.session.cart.push({
            ...product,
            size: size || 'M',
            color: color || 'Trắng',
            quantity: parseInt(quantity) || 1
        });
    }

    res.redirect('/cart');
};



// Hiển thị giỏ hàng
exports.viewCart = (req, res) => {
    const cart = req.session.cart || [];
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = total * 0.08;
    const grandTotal = total + tax;

    res.render('cart', {
        cart,
        total,
        taxAmount: tax,
        grandTotal,
        message: null,
        user: req.session.user
    });
};

// Xóa sản phẩm khỏi giỏ
exports.removeFromCart = (req, res) => {
    const { id, size, color } = req.params;
    const cart = req.session.cart || [];

    const index = cart.findIndex(item =>
        item.id == id && item.size == size && item.color === color
    );

    if (index === -1) {
        return res.status(404).render('404');
    }

    cart.splice(index, 1);
    req.session.cart = cart;
    res.redirect('/cart');
};

// Tăng/giảm số lượng
exports.updateCartQuantity = (req, res) => {
    const { id, size, color, action } = req.params;
    const cart = req.session.cart || [];

    const item = cart.find(p =>
        p.id == id && p.size == size && p.color === color
    );

    if (!item) {
        return res.status(404).render('404');
    }

    if (action === 'increase') {
        item.quantity += 1;
    } else if (action === 'decrease') {
        item.quantity = Math.max(1, item.quantity - 1);
    }

    res.redirect('/cart');
};
// Thanh toán toàn bộ giỏ hàng
exports.checkoutCart = (req, res) => {
    const cart = req.session.cart || [];
    if (!cart.length) return res.redirect('/cart');

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = total * 0.08;
    const grandTotal = total + tax;

    const orders = readJSON(ordersFile);

    const newOrder = {
        id: Date.now(),
        userId: req.session.user.id,
        username: req.session.user.username,
        items: cart,
        totalAmount: total,
        tax,
        grandTotal,
        date: new Date().toISOString()
    };

    orders.push(newOrder);
    writeJSON(ordersFile, orders);

    // Clear giỏ hàng user
    const users = readJSON(usersFile);
    const index = users.findIndex(u => u.id === req.session.user.id);
    if (index !== -1) {
        users[index].cart = [];
        writeJSON(usersFile, users);
    }

    req.session.cart = [];

    res.render('invoice', {
        order: newOrder,
        user: req.session.user
    });
};

// Đăng ký
exports.getRegisterPage = (req, res) => {
    res.render('register', { error: null, user: null });
};

exports.handleRegister = (req, res) => {
    const { username, password } = req.body;
    const users = readJSON(usersFile);
    const existing = users.find(u => u.username === username);

    if (existing) {
        return res.render('register', { error: 'Tên đăng nhập đã tồn tại', user: null });
    }

    const newUser = {
        id: Date.now(),
        username,
        password,
        role: 'user',
        cart: [],
        name: '',
        email: '',
        address: ''
    };

    users.push(newUser);
    writeJSON(usersFile, users);
    res.redirect('/login');
};

// Tìm kiếm sản phẩm
exports.searchProducts = (req, res) => {
    const query = req.query.q?.toLowerCase() || '';
    const products = readJSON(productsFile);
    const results = products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );

    res.render('products-list', {
        title: `Kết quả tìm kiếm cho "${req.query.q}"`,
        categoryTitle: 'Kết quả tìm kiếm',
        products: results,
        user: req.session.user
    });
};

// Tài khoản người dùng
exports.getAccountPage = (req, res) => {
    const userId = req.session.user?.id;
    if (!userId) return res.redirect('/login');

    const users = readJSON(usersFile);
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(404).send('Không tìm thấy người dùng');

    res.render('account', { user });
};

exports.updateAccountInfo = (req, res) => {
    const userId = req.session.user?.id;
    if (!userId) return res.redirect('/login');

    const { name, email, address } = req.body;
    const users = readJSON(usersFile);
    const index = users.findIndex(u => u.id === userId);

    if (index === -1) return res.status(404).send('Không tìm thấy người dùng');

    users[index].name = name;
    users[index].email = email;
    users[index].address = address;

    writeJSON(usersFile, users);
    req.session.user = users[index];

    res.redirect('/account');
};
