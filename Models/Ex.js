const { array } = require("joi");
let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let Demo = new Schema({
    id: {
        type: String
    },
    name: {
        type: String
    },
    parentId: {
        type: String,
        default: null
    },
    child: {
        type: Array
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Demo", Demo);