// index.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import admin from "firebase-admin";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Firebase setup
const serviceAccountPath =
  process.env.FIREBASE_KEY_PATH || "/etc/secrets/serviceAccountKey.json";

const serviceAccount = JSON.parse(
  fs.readFileSync(path.resolve(serviceAccountPath), "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ===== Routes =====

// Get all users
app.get("/users", async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all deposits
app.get("/deposits", async (req, res) => {
  try {
    const snapshot = await db.collection("deposits").get();
    const deposits = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(deposits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all withdrawals
app.get("/withdrawals", async (req, res) => {
  try {
    const snapshot = await db.collection("withdrawals").get();
    const withdrawals = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(withdrawals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all user investments
app.get("/userinvestments", async (req, res) => {
  try {
    const snapshot = await db.collection("userinvestments").get();
    const userInvestments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(userInvestments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all tasks
app.get("/tasks", async (req, res) => {
  try {
    const snapshot = await db.collection("tasks").get();
    const tasks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all task submissions
app.get("/task-submissions", async (req, res) => {
  try {
    const snapshot = await db.collection("task-submissions").get();
    const submissions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all investment plans
app.get("/investment-plans", async (req, res) => {
  try {
    const snapshot = await db.collection("investmentPlans").get();
    const plans = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Default route
app.get("/", (req, res) => {
  res.send("Zyppayx Backend Running 🚀");
});

// Start server
app.listen(PORT, () => {
  console.log(`Zyppayx backend running on port ${PORT} 🚀`);
});
