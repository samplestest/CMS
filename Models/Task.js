let mongoose = require("mongoose");
let Schema = mongoose.Schema;
const Config = require("../Config")

const Task = new Schema({
    addedBy: {
        type: Schema.Types.ObjectId,
        ref: "Admin"
    },
    task: {
        type: String
    },
    projectId: {
        type: Schema.Types.ObjectId,
        ref: "Project"
    },
    employeeId: [
        {
            type: Schema.Types.ObjectId,
        }
    ],
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    status: {
        type: String,
        enum: Object.values(Config.APP_CONSTANTS.DATABASE.TASK_RESPONSE),
        default: "PENDING"
    },
    // workingTime: {
    //     type: Number,
    //     default: 0
    // },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Task", Task)