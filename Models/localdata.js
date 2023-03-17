let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let LocalData = new Schema({
    deptName: {
        type: String
    },
    isDelete: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("LocalData", LocalData);