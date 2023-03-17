"use strict"

const Service = require("../Services").queries;
const UniversalFunctions = require("../Utils/UniversalFunction");
const Config = require("../Config");
const Model = require("../Models");
const CodeGenerator = require("../Lib/CodeGenerator");
const { payload } = require("@hapi/hapi/lib/validation");

async function localData(payloadData) {
    try {
        // let data = Model.LocalData();
        // data.save();
        // console.log("data:", data);
        // return data;

        const data = Service.saveData(Model.LocalData, payloadData);
        console.log("data:", data);
        return data;
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

async function getLocalData(queryData) {
    try {
        const data = Service.getData(Model.LocalData, { isDelete: false });

        return data;
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
    }
}



module.exports = {
    localData,
    getLocalData
}