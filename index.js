import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
const serviceAccount = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'serviceAccountKey.json')));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// ---------- Routes ---------- //

// Health check
app.get('/', (req, res) => res.send('Zyppayx Backend is Running 🚀'));

// ---------- Users ----------
app.get('/users', async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/users', async (req, res) => {
  try {
    const data = req.body;
    const docRef = await db.collection('users').add(data);
    res.json({ id: docRef.id, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Tasks ----------
app.get('/tasks', async (req, res) => {
  const snapshot = await db.collection('tasks').get();
  const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json(tasks);
});

app.post('/tasks', async (req, res) => {
  const { title, description } = req.body;
  const newTask = { title, description, createdAt: new Date() };
  const docRef = await db.collection('tasks').add(newTask);
  res.json({ id: docRef.id, ...newTask });
});

// ---------- Task Submissions ----------
app.get('/task-submissions', async (req, res) => {
  const snapshot = await db.collection('task-submissions').get();
  const submissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json(submissions);
});

app.post('/task-submissions', async (req, res) => {
  const { userId, taskId, submission } = req.body;
  const data = { userId, taskId, submission, submittedAt: new Date() };
  const docRef = await db.collection('task-submissions').add(data);
  res.json({ id: docRef.id, ...data });
});

// ---------- Withdrawals ----------
app.get('/withdrawals', async (req, res) => {
  const snapshot = await db.collection('withdrawals').get();
  res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
});

app.post('/withdrawals', async (req, res) => {
  const { userId, amount, status = 'pending' } = req.body;
  const docRef = await db.collection('withdrawals').add({ userId, amount, status, createdAt: new Date() });
  res.json({ id: docRef.id, userId, amount, status });
});

// ---------- Investment Plans ----------
app.get('/investmentPlans', async (req, res) => {
  const snapshot = await db.collection('investmentPlans').get();
  res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
});

app.post('/investmentPlans', async (req, res) => {
  const { name, durationDays, minAmount, maxAmount, interest } = req.body;
  const docRef = await db.collection('investmentPlans').add({ name, durationDays, minAmount, maxAmount, interest });
  res.json({ id: docRef.id, name, durationDays, minAmount, maxAmount, interest });
});

// ---------- Promotions ----------
app.get('/promotions', async (req, res) => {
  const snapshot = await db.collection('promotions').get();
  res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
});

app.post('/promotions', async (req, res) => {
  const { title, description } = req.body;
  const docRef = await db.collection('promotions').add({ title, description, createdAt: new Date() });
  res.json({ id: docRef.id, title, description });
});

// ---------- Banner Ads ----------
app.get('/banner_ads', async (req, res) => {
  const snapshot = await db.collection('banner_ads').get();
  res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
});

app.post('/banner_ads', async (req, res) => {
  const { imageUrl, link } = req.body;
  const docRef = await db.collection('banner_ads').add({ imageUrl, link, createdAt: new Date() });
  res.json({ id: docRef.id, imageUrl, link });
});

// ---------- User Investments ----------
app.get('/userinvestments', async (req, res) => {
  const snapshot = await db.collection('userinvestments').get();
  res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
});

app.post('/userinvestments', async (req, res) => {
  const { userId, planId, amount, status = 'active' } = req.body;
  const docRef = await db.collection('userinvestments').add({ userId, planId, amount, status, createdAt: new Date() });
  res.json({ id: docRef.id, userId, planId, amount, status });
});

// ---------- Deposit via Paystack ----------
app.post('/deposit', async (req, res) => {
  const { email, amount } = req.body;
  const fee = amount * 0.02;
  const total = amount + fee;

  try {
    // Initialize Paystack transaction
    const response = await axios.post('https://api.paystack.co/transaction/initialize', {
      email,
      amount: total * 100
    }, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });

    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Start Server ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Zyppayx backend running on port ${PORT} 🚀`));
