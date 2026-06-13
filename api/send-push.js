const admin = require("firebase-admin");

function getApp() {
  if (admin.apps.length) return admin.app();
  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { persons, title, body } = req.body || {};
    if (!Array.isArray(persons) || !persons.length || !title) {
      res.status(400).json({ error: "persons (array) and title are required" });
      return;
    }

    const app = getApp();
    const db = admin.firestore(app);

    const tokensSnap = await db.collection("tansha").doc("tokens").get();
    const tokensMap = tokensSnap.exists ? tokensSnap.data().value || {} : {};

    const tokens = [];
    for (const person of persons) {
      const personTokens = tokensMap[person];
      if (Array.isArray(personTokens)) tokens.push(...personTokens);
    }
    const uniqueTokens = [...new Set(tokens)];

    if (!uniqueTokens.length) {
      res.status(200).json({ sent: 0, message: "No registered devices for these users" });
      return;
    }

    const response = await admin.messaging(app).sendEachForMulticast({
      tokens: uniqueTokens,
      notification: { title, body: body || "" },
    });

    res.status(200).json({ sent: response.successCount, failed: response.failureCount });
  } catch (err) {
    console.error("send-push error:", err);
    res.status(500).json({ error: "Internal error" });
  }
};
