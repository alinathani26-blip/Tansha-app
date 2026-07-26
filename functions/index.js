const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Initialize with default credentials (automatically available when deployed to Firebase)
if (!admin.apps.length) {
  admin.initializeApp();
}

const ALLOWED_ORIGINS = [
  "https://tansha-hospitality.web.app",
  "https://tansha-hospitality.firebaseapp.com",
];

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
  } else {
    // Allow all origins during development; tighten in production if needed
    res.set("Access-Control-Allow-Origin", "*");
  }
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

exports.sendPush = onRequest({ region: "us-central1" }, async (req, res) => {
  setCorsHeaders(req, res);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

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

    const db = admin.firestore();

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

    const response = await admin.messaging().sendEachForMulticast({
      tokens: uniqueTokens,
      notification: { title, body: body || "" },
    });

    res.status(200).json({ sent: response.successCount, failed: response.failureCount });
  } catch (err) {
    console.error("sendPush error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});
