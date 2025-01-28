const mongoose = require('mongoose');

const CardSchema = new mongoose.Schema({
    id: String,
    image: String,
});

module.exports = mongoose.model('Card', CardSchema);