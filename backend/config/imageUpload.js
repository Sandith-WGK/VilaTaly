const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const sharp = require('sharp');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
    }
  }
});

// Function to optimize image before upload
const optimizeImage = async (buffer) => {
  try {
    return await sharp(buffer)
      .resize(800, 800, { // Resize to max 800x800
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 }) // Convert to JPEG with 80% quality
      .toBuffer();
  } catch (error) {
    console.error('Error optimizing image:', error);
    return buffer; // Return original buffer if optimization fails
  }
};

// Function to upload image to ImgBB
const uploadToImgBB = async (file) => {
  try {
    // Optimize image before upload
    const optimizedBuffer = await optimizeImage(file.buffer);
    
    const formData = new FormData();
    formData.append('image', optimizedBuffer.toString('base64'));
    
    const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
      params: {
        key: process.env.IMGBB_API_KEY
      },
      headers: {
        ...formData.getHeaders()
      }
    });

    return response.data.data.url;
  } catch (error) {
    console.error('Error uploading to ImgBB:', error);
    throw new Error('Failed to upload image');
  }
};

module.exports = {
  upload,
  uploadToImgBB
}; 