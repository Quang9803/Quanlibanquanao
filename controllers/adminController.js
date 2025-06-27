const fs = require('fs');
const path = require('path');
const usersFile = path.join(__dirname, '../data/users.json'); 

const productsFile = path.join(__dirname, '../data/products.json');
const ordersFile = path.join(__dirname, '../data/orders.json');

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

    const detailedOrders = orders.map(order => {
        const user = users.find(u => u.id === order.userId);
        let items = order.items || [];

        let subtotal = 0;
        items = items.map(item => {
            const product = products.find(p => p.id === item.id);
            const total = item.price * item.quantity;
            subtotal += total;
            return {
                name: product?.name || 'Không tìm thấy',
                size: item.size,
                quantity: item.quantity,
                price: item.price,
                total
            };
        });

        totalRevenue += subtotal;

        return {
            id: order.id,
            user: user?.username || 'Không rõ',
            date: new Date(order.date).toLocaleString(),
            items,
            subtotal
        };
    });

    res.render('statistics', {
        user: req.session.user,
        orders: detailedOrders,
        totalOrders: detailedOrders.length,
        totalRevenue
    });
};
