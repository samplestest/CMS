const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let Salary = new Schema({
    addedBy: {
        type: Schema.Types.ObjectId,
        ref: "Admin"
    },
    employeeId: {
        type: Schema.Types.ObjectId,
        ref: "Employee"
    },
    employeeName: {
        type: String
    },
    salary: {
        type: Number,
        default: 0
    },
    salaryDetail: [{
        month: { type: Number },
        year: { type: Number },
        monthTotalLeave: { type: Number },
        paidSalary: { type: Number }
    }],
    bonus: {
        type: Number,
        default: 0
    },
    reasonForBouns: {
        type: String,
        default: 'N/A'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Salary", Salary);