let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let Module = new Schema({
    name: { type: String, unique: true, trim: true },
    icon: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    childs: { type: Array, default: [] },
    index: { type: Number },
    isDeleted: { type: Boolean, default: false },
},
    {
        timestamps: true
    });

module.exports = mongoose.model('Module', Module);