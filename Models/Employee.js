const { string } = require("joi");
let mongoose = require("mongoose");
let Schema = mongoose.Schema
const Config = require("../Config");

let Employee = new Schema({
    firstName: {
        type: String
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
    DOB: {
        type: String,
    },
    HireDate: {
        type: Date,
        default: Date.now()
    },
    departmentId: [
        {
            type: Schema.ObjectId,
            ref: 'Department',
            minlength: 1,
            required: true,
        }
    ],
    salary: {
        type: Number
    },
    isDeleted: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    addedBy: { type: Schema.ObjectId, ref: 'Admin' },
    accessToken: { type: String, trim: true, index: true, sparse: true, default: null }
}, {
    timestamps: true
});
module.exports = mongoose.model("Employee", Employee)