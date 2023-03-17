const { string } = require("joi");
let mongoose = require("mongoose");
let Schema = mongoose.Schema;
let Config = require("../Config");

let Leave = new Schema({
    applicantID: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    title: {
        type: String
    },
    type: {
        type: String
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    // date: [
    //     {
    //         startDate: {
    //             type: Date
    //         },
    //         endDate: {
    //             type: Date
    //         }
    //     }
    // ],
    appliedDate: {
        type: Date,
        default: Date.now()
    },
    period: {
        type: Number,
        // min: 1,
        // max: 10
    },
    reason: {
        type: String
    },
    adminResponse: {
        type: String,
        enum: Object.values(Config.APP_CONSTANTS.DATABASE.ADMIM_RESPONSE),
        default: 'PENDING'
        // default: 'N/A'
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Leave", Leave);
``