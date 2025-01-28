const express = require('express');
const router = express.Router();
const CardModel = require('../models/CardModel');

router.get('/cards', async (req, res) => {
    try {
        const cards = await CardModel.find().lean();
        res.json({ cards });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;