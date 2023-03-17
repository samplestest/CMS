let mongoose = require("mongoose");
let Schema = mongoose.Schema;
const Config = require("../Config");

const taskTimer = new Schema({
    taskId: {
        type: Schema.Types.ObjectId,
        ref: "Task"
    },
    projectId: {
        type: Schema.Types.ObjectId,
        ref: "Project"
    },
    startTime: {
        type: Date
    },
    endTime: {
        type: Date
    },
    // workingHour: {
    //     // startTime: String,
    //     // endTime: String,
    //     type: Number,
    //     default: 0
    // },
    // status: {
    //     type: String,
    //     enum: Object.values(Config.APP_CONSTANTS.DATABASE.TASK_RESPONSE),
    //     default: "PENDING"
    // },
    addedBy: {
        type: Schema.Types.ObjectId,
        ref: "Employee"
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("taskTimer", taskTimer)