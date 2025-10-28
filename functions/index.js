const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();

// Pobieranie tajnego klucza z konfiguracji Firebase
const SECRET_KEY = functions.config().recaptcha.secret;

exports.verifyRecaptcha = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send({ success: false, message: 'Method Not Allowed' });
  }

  const token = req.body.token;

  if (!token) {
    return res.status(400).send({ success: false, message: 'Missing token' });
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${SECRET_KEY}&response=${token}`,
    });

    const data = await response.json();

    if (data.success) {
      return res.status(200).send({ success: true });
    } else {
      return res.status(400).send({ success: false, errors: data['error-codes'] });
    }
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return res.status(500).send({ success: false, message: 'Internal Server Error' });
  }
});
