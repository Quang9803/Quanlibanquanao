const fs = require('fs');
const path = require('path');
const usersFile = path.join(__dirname, '../data/users.json'); 

const productsFile = path.join(__dirname, '../data/products.json');
const ordersFile = path.join(__dirname, '../data/orders.json');

const productFilePath = path.join(__dirname, '../data/products.json');

function readJSON(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}
function writeJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Trang chính admin
exports.getAdminPage = (req, res) => {
    res.redirect('/admin/products');
};

// Danh sách sản phẩm
exports.getProductList = (req, res) => {
    const products = readJSON(productsFile);
    res.render('admin', { user: req.session.user, products });
};

// Trang thêm sản phẩm
exports.getAddProductPage = (req, res) => {
    res.render('admin/add-product', { user: req.session.user });
};

// Xử lý thêm sản phẩm
exports.handleAddProduct = (req, res) => {
    const products = readJSON(productsFile);

    const newProduct = {
    id: Date.now(),
    name: req.body.name,
    price: parseInt(req.body.price),
    description: req.body.description || '',
    category: req.body.category, 
    image: req.file ? '/images/' + req.file.filename : '',
    sizes: {
        S: parseInt(req.body.sizeS || 0),
        M: parseInt(req.body.sizeM || 0),
        L: parseInt(req.body.sizeL || 0),
        XL: parseInt(req.body.sizeXL || 0)
    }
    };


    products.push(newProduct);
    writeJSON(productsFile, products);

    res.redirect('/admin/products');
};

// Trang sửa sản phẩm
exports.getEditProductPage = (req, res) => {
    const products = readJSON(productsFile);
    const product = products.find(p => p.id == req.params.id);
    if (!product) return res.send('Không tìm thấy sản phẩm');

    res.render('admin/edit-product', { product, user: req.session.user });
};

// Xử lý sửa sản phẩm
exports.handleEditProduct = (req, res) => {
    const products = readJSON(productsFile);
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);

    if (index !== -1) {
        products[index].name = req.body.name;
        products[index].price = parseFloat(req.body.price);
        products[index].description = req.body.description;
        products[index].category = req.body.category;
        // Cập nhật hình ảnh nếu có ảnh mới
        if (req.file) {
            products[index].image = '/images/' + req.file.filename;
        }

        // Cập nhật size nếu có
        products[index].sizes = {
            S: parseInt(req.body.sizeS || 0),
            M: parseInt(req.body.sizeM || 0),
            L: parseInt(req.body.sizeL || 0),
            XL: parseInt(req.body.sizeXL || 0)
        };

        writeJSON(productsFile, products);
    }

    res.redirect('/admin/products');
};

// Xóa sản phẩm
exports.deleteProduct = (req, res) => {
    const id = parseInt(req.params.id);
    let products = readJSON(productsFile);
    products = products.filter(p => p.id !== id);
    writeJSON(productsFile, products);
    res.redirect('/admin/products');
};

// Trang thống kê
exports.getStatistics = (req, res) => {
    const orders = readJSON(ordersFile);
    const users = readJSON(usersFile);
    const products = readJSON(productsFile);

    let totalRevenue = 0;
    const taxRate = 0.08;

    const detailedOrders = orders.map(order => {
        const user = users.find(u => u.id === order.userId);
        let items = order.items || [];

        let subtotal = 0;
        items = items.map(item => {
            const product = products.find(p => p.id === item.id);
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            return {
                name: product?.name || 'Không tìm thấy',
                size: item.size,
                quantity: item.quantity,
                price: item.price,
                total: itemTotal
            };
        });

        const tax = subtotal * taxRate;
        const grandTotal = subtotal + tax;
        totalRevenue += subtotal;

        return {
            id: order.id,
            user: user?.username || 'Không rõ',
            date: new Date(order.date).toLocaleString(),
            items,
            subtotal,
            tax,
            grandTotal
        };
    });

    res.render('statistics', {
        user: req.session.user,
        orders: detailedOrders,
        totalOrders: detailedOrders.length,
        totalRevenue
    });
};

//from nhập hàng
exports.getImportPage = (req, res) => {
    const products = readJSON(productsFile);
    const id = req.params.id;
    const product = products.find(p => String(p.id) === id);

    if (!product) return res.status(404).send("Sản phẩm không tồn tại");

    res.render('admin/nhap-hang', { product });
};

exports.handleImportProduct = (req, res) => {
    const products = readJSON(productsFile);
    const id = req.params.id;
    const index = products.findIndex(p => String(p.id) === id);

    if (index === -1) return res.status(404).send("Không tìm thấy sản phẩm");

    const addedSizes = {
        S: parseInt(req.body.sizeS || 0),
        M: parseInt(req.body.sizeM || 0),
        L: parseInt(req.body.sizeL || 0),
        XL: parseInt(req.body.sizeXL || 0),
    };

    const currentSizes = products[index].sizes || { S: 0, M: 0, L: 0, XL: 0 };
    products[index].sizes = {
        S: (parseInt(currentSizes.S) || 0) + addedSizes.S,
        M: (parseInt(currentSizes.M) || 0) + addedSizes.M,
        L: (parseInt(currentSizes.L) || 0) + addedSizes.L,
        XL: (parseInt(currentSizes.XL) || 0) + addedSizes.XL,
    };

    writeJSON(productsFile, products);
    res.redirect('/admin');
};
// Hiển thị danh sách người dùng
exports.getUserList = (req, res) => {
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    res.render('admin-user-list', { users });
};

// Xóa người dùng theo ID
exports.deleteUser = (req, res) => {
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    const userId = parseInt(req.params.id, 10); // Ép kiểu ID

    const updatedUsers = users.filter(user => user.id !== userId);

    fs.writeFileSync(usersFile, JSON.stringify(updatedUsers, null, 2), 'utf8');
    res.redirect('/admin/users');
};
