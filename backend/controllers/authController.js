const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const normalizeRole = (role) => role ? String(role).trim().toLowerCase() : 'customer';

const isValidEmail = (email) => typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const allowedRegisterRoles = ['customer', 'provider'];

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedRole = normalizeRole(role);
    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json({ message: 'User already exists' });
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: allowedRegisterRoles.includes(normalizedRole) ? normalizedRole : 'customer'
    });
    res.status(201).json({ token: generateToken(user._id), user: { id: user._id, name: user.name, email: user.email, role: normalizeRole(user.role) } });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    res.json({ token: generateToken(user._id), user: { id: user._id, name: user.name, email: user.email, role: normalizeRole(user.role) } });
  } catch (err) { next(err); }
};

exports.me = async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: normalizeRole(req.user.role)
  });
};
