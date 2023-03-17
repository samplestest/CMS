let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let Department = new Schema({
    addedBy: {
        type: Schema.ObjectId,
        ref: 'Admin'
    },
    deptNo: {
        type: String
    },
    deptName: {
        type: String
    },
    MGRNO: {
        type: String
    },
    isDelete: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Department", Department);