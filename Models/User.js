const { string } = require('joi');
let mongoose = require('mongoose');
let Schema = mongoose.Schema

let Users = new Schema({
    firstName: {
        type: String,
    },
    lastName: {
        type: String
    },
    email: {
        type: String
    },
    password: {
        type: String
    },
    mobile: {
        type: String
    },
    image: {
        type: String
    },
    address: [{
        name: { type: String },
        mobile: { type: String },
        address: { type: String },
        location: { type: String },
        pincode: { type: String },
        city: { type: String },
        state: { type: String },
        type: { type: String },
        default: { type: Boolean, default: false }
    }],
    isDeleted: {
        type: Boolean,
        default: false
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    accessToken: {
        type: String,
        default: null
    }
}, {
    timestamps: true
})

module.exports = mongoose.model("User", Users);