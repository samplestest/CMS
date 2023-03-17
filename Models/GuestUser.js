let mongoose = require("mongoose");
let Schema = mongoose.Schema
let Config = require("../Config")

let GuestUser = new Schema({
    ipAddress: {
        type: String
    },
    country: {
        type: String
    },
    state: {
        type: String
    },
    city: {
        type: String
    }
}, {
    timestamps: true
});
module.exports = mongoose.model("GuestUser", GuestUser);