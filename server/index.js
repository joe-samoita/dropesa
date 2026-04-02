const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const mpesaRouter = require('./routes/mpesa');
const authRouter = require('./routes/auth');
const contactsRouter = require('./routes/contacts');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dropesa')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => res.json({ message: 'Dropesa API running' }));
app.use('/api/auth', authRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/mpesa', mpesaRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Dropesa server listening on ${PORT}`);
});
