const express = require('express');
const multer = require('multer');
const path = require('path');
const { PrismaClient } = require('./generated/prisma');
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const policyRoutes = require('./routes/policies');
const assessmentRoutes = require('./routes/assessments');
const performanceRoutes = require('./routes/performance');
const trainingRoutes = require('./routes/training');

const app = express();
const prisma = new PrismaClient();

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'policyDocument') {
      cb(null, 'uploads/policy-documents/');
    } else if (file.fieldname === 'trainingMaterial') {
      cb(null, 'uploads/training-materials/');
    } else {
      cb(new Error('Invalid field name'), null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow common document and media types
  const allowedTypes = /pdf|doc|docx|txt|jpg|jpeg|png|mp4|avi|mov/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Auth routes
app.use('/auth', authRoutes);

// Employee management routes
app.use('/employees', employeeRoutes);

// Policy management routes
app.use('/policies', policyRoutes);

// Assessment management routes
app.use('/assessments', assessmentRoutes);

// Performance management routes
app.use('/performance', performanceRoutes);

// Training content routes
app.use('/training', trainingRoutes);

app.get('/', (req, res) => res.send('Hello World'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));