const express = require('express');
const { PrismaClient } = require('./generated/prisma');
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const policyRoutes = require('./routes/policies');
const assessmentRoutes = require('./routes/assessments');
const performanceRoutes = require('./routes/performance');
const trainingRoutes = require('./routes/training');

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

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