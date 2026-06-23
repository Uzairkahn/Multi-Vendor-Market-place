exports.authorizeRoles = (...roles) => (req, res, next) => {
  const userRole = req.user && req.user.role ? String(req.user.role).trim().toLowerCase() : '';
  const allowedRoles = roles.map((r) => String(r).trim().toLowerCase());
  if (!allowedRoles.includes(userRole)) return res.status(403).json({ message: 'Forbidden' });
  next();
};
