const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const getTimestamp = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
};

const getPassword = () => {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const timestamp = getTimestamp();
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
};

const getAuthToken = async () => {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  const tokenUrl = process.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

  const response = await axios.get(tokenUrl, {
    auth: { username: key, password: secret },
  });

  return response.data.access_token;
};

router.post('/stkpush', authMiddleware, async (req, res) => {
  try {
    const { phoneNumber, amount, accountReference, transactionDesc } = req.body;
    if (!phoneNumber || !amount) {
      return res.status(400).json({ error: 'phoneNumber and amount are required' });
    }

    const accessToken = await getAuthToken();
    const shortcode = process.env.MPESA_SHORTCODE;
    const callbackUrl = process.env.MPESA_CALLBACK_URL;
    const timestamp = getTimestamp();
    const password = getPassword();

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: callbackUrl,
      AccountReference: accountReference || `Dropesa-${uuidv4().slice(0, 6)}`,
      TransactionDesc: transactionDesc || 'Dropesa payment',
    };

    const apiUrl = process.env.MPESA_ENV === 'production'
      ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

    const { data } = await axios.post(apiUrl, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Save pending transaction to database
    const txn = new Transaction({
      id: data.CheckoutRequestID,
      status: 'PENDING',
      amount,
      phoneNumber,
      accountReference: payload.AccountReference,
      transactionDesc: payload.TransactionDesc,
      rawResponse: data,
    });
    await txn.save();

    res.json({ requestId: data.CheckoutRequestID, response: data });
  } catch (error) {
    console.error('STK push error:', error?.response?.data || error.message);
    res.status(500).json({ error: error?.response?.data || 'STK push failed' });
  }
});

router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const txns = await Transaction.find().sort({ createdAt: -1 });
    res.json(txns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/callback', async (req, res) => {
  try {
    console.log('STK callback', JSON.stringify(req.body));

    const callbackData = req.body;
    const checkout = callbackData?.Body?.stkCallback;

    if (!checkout || !checkout.CheckoutRequestID) {
      return res.status(400).json({ result: 'missing checkout id' });
    }

    // Find and update transaction
    let txn = await Transaction.findOne({ id: checkout.CheckoutRequestID });
    
    if (!txn) {
      txn = new Transaction({
        id: checkout.CheckoutRequestID,
        amount: 0,
        phoneNumber: '',
      });
    }

    txn.status = checkout.ResultCode === 0 ? 'SUCCESS' : 'FAILED';
    txn.callback = checkout;
    txn.updatedAt = new Date();
    await txn.save();

    res.json({ result: 'success' });
  } catch (error) {
    console.error('Callback error:', error.message);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
