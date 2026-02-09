import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import admin from "firebase-admin";

const app = express();
app.use(cors());
app.use(express.json());

/* ===============================
   FIREBASE ADMIN INIT
================================ */
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  )
});
const db = admin.firestore();

/* ===============================
   1️⃣ VERIFY DEPOSIT (PAYSTACK)
================================ */
app.post("/verify-deposit", async (req, res) => {
  try {
    const { reference, uid } = req.body;
    if (!reference || !uid) return res.status(400).json({ error: "Missing data" });

    const payRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );
    const result = await payRes.json();

    if (!result.status || result.data.status !== "success") {
      return res.status(400).json({ error: "Payment not successful" });
    }

    const amount = result.data.amount / 100;

    await db.runTransaction(async (t) => {
      const userRef = db.collection("users").doc(uid);
      const txRef = db.collection("transactions").doc(reference);

      if ((await t.get(txRef)).exists) throw "Already credited";

      t.set(txRef, {
        uid,
        type: "deposit",
        amount,
        reference,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      t.update(userRef, {
        balance: admin.firestore.FieldValue.increment(amount)
      });
    });

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

/* ===============================
   2️⃣ APPROVE TASK → AUTO CREDIT
================================ */
app.post("/approve-task", async (req, res) => {
  try {
    const { submissionId } = req.body;

    const subRef = db.collection("task-submissions").doc(submissionId);

    await db.runTransaction(async (t) => {
      const subSnap = await t.get(subRef);
      if (!subSnap.exists) throw "Submission not found";

      const sub = subSnap.data();
      if (sub.paid) throw "Already paid";

      const userRef = db.collection("users").doc(sub.userId);

      t.update(userRef, {
        balance: admin.firestore.FieldValue.increment(sub.reward)
      });

      t.update(subRef, {
        status: "approved",
        paid: true,
        approvedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

/* ===============================
   3️⃣ PROCESS WITHDRAWAL
================================ */
app.post("/process-withdrawal", async (req, res) => {
  try {
    const { withdrawalId } = req.body;
    const wdRef = db.collection("withdrawals").doc(withdrawalId);

    const wdSnap = await wdRef.get();
    if (!wdSnap.exists) return res.status(404).json({ error: "Not found" });

    const wd = wdSnap.data();
    if (wd.status !== "pending") throw "Already processed";

    const userRef = db.collection("users").doc(wd.uid);

    await db.runTransaction(async (t) => {
      const userSnap = await t.get(userRef);
      if (userSnap.data().balance < wd.amount) throw "Insufficient balance";

      t.update(userRef, {
        balance: admin.firestore.FieldValue.increment(-wd.amount)
      });

      t.update(wdRef, {
        status: "processing"
      });
    });

    // (Optional) Paystack transfer logic goes here

    await wdRef.update({
      status: "completed",
      completedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

/* ===============================
   4️⃣ INVESTMENT PROFIT RUN
================================ */
app.post("/run-investments", async (_, res) => {
  const snaps = await db.collection("userinvestments")
    .where("status", "==", "active")
    .get();

  const batch = db.batch();

  snaps.forEach(doc => {
    const inv = doc.data();
    const profit = inv.amount * inv.dailyRate;

    batch.update(db.collection("users").doc(inv.uid), {
      balance: admin.firestore.FieldValue.increment(profit)
    });

    batch.update(doc.ref, {
      lastRun: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  await batch.commit();
  res.json({ success: true });
});

/* ===============================
   SERVER START
================================ */
app.listen(3000, () => {
  console.log("Zyppayx backend running");
});