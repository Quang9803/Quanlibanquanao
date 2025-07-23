exports.requireLogin = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    return res.redirect('/login');
};

exports.requireAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    return res.status(403).send('Bạn không có quyền truy cập');
};
