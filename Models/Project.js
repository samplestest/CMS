let mongoose = require("mongoose");
let Schema = mongoose.Schema

let Project = new Schema({
    addedBy: {
        type: Schema.Types.ObjectId,
        ref: "Admin"
    },
    title: {
        type: String
    },
    description: {
        type: String
    },
    employeeId: [
        {
            type: Schema.Types.ObjectId
        }
    ],
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Project", Project);