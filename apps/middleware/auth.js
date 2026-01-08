
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/login');
};

const isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }

  const isApiRequest = req.headers['content-type']?.includes('application/json') ||
                       req.headers['accept']?.includes('application/json') ||
                       req.path.startsWith('/api');

  if (isApiRequest) {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }

  res.status(403).send('Access denied. Admin privileges required.');
};

module.exports = {
  isAuthenticated,
  isAdmin
};

