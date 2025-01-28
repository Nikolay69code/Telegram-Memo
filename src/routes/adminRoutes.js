const express = require('express');
const router = express.Router();
const CardModel = require('../models/CardModel');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const newCard = new CardModel({
            id: req.body.id,
            image: `/uploads/${req.file.filename}`
        });
        await newCard.save();
        res.json({ message: 'Card added successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;