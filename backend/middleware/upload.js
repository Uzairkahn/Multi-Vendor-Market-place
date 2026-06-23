const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
});

const deliveryUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = upload;
module.exports.deliveryUpload = deliveryUpload;
