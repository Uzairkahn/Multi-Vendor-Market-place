require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const serviceRoutes = require('./routes/services');
const requestRoutes = require('./routes/requests');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const providerProfileRoutes = require('./routes/providerProfiles');

const app = express();
connectDB();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/provider-profiles', providerProfileRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'OK' });
});

app.use(express.static(path.join(__dirname, '../frontend')));

app.use((err, req, res, next) => {
  console.error(err.stack || err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
