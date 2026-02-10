
// index.js - Zyppayx Backend
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

// ---------- Initialize Firebase Admin ----------
const serviceAccountPath = process.env.FIREBASE_KEY_PATH; // from .env
if (!serviceAccountPath) {
  console.error("❌ FIREBASE_KEY_PATH is not defined in .env");
  process.exit(1);
}

const serviceAccount = JSON.parse(
  fs.readFileSync(path.resolve(serviceAccountPath))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ---------- Routes ---------- //

// Health check
app.get('/', (req, res) => {
  res.send('Zyppayx Backend is Running 🚀');
});

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

// ---------- Deposits ----------
app.get('/deposits', async (req, res) => {
  try {
    const snapshot = await db.collection('deposits').get();
    const deposits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(deposits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Withdrawals ----------
app.get('/withdrawals', async (req, res) => {
  try {
    const snapshot = await db.collection('withdrawals').get();
    const withdrawals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(withdrawals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Investments ----------
app.get('/userinvestments', async (req, res) => {
  try {
    const snapshot = await db.collection('userinvestments').get();
    const investments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(investments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Task Submissions ----------
app.get('/task-submissions', async (req, res) => {
  try {
    const snapshot = await db.collection('task-submissions').get();
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Task List ----------
app.get('/tasks', async (req, res) => {
  try {
    const snapshot = await db.collection('tasks').get();
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Start Server ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Zyppayx backend running on port ${PORT} 🚀`);
});
