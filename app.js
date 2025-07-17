const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = 3000;

// Cấu hình view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware xử lý dữ liệu và session
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: 'secretKey',
    resave: false,
    saveUninitialized: true
}));

// Phục vụ file tĩnh (CSS, hình ảnh, JS) từ thư mục "public"
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', userRoutes);
app.use('/admin', adminRoutes);

// Trang không tồn tại (404)
app.use((req, res) => {
    res.status(404).render('404', { title: 'Không tìm thấy trang' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
