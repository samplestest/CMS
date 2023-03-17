"use strict"

const Service = require("../Services").queries;
const UniversalFunctions = require("../Utils/UniversalFunction");
const Config = require("../Config");
const Model = require("../Models");
const TokenManager = require("../Lib/TokenManager");
const CodeGenerator = require("../Lib/CodeGenerator");
const emailFunction = require("../Lib/email");
const { $_match } = require("@hapi/joi/lib/base");
const { findOne } = require("../Models/User");
const moment = require("moment");

//Employee Login
async function employeeLogin(payloadData) {
    try {
        const emp = await Service.findOne(Model.Employee, { email: payloadData.email })
        if (!emp)
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.NOT_EXIST);
        const validate = await UniversalFunctions.comparePassword(payloadData.password.toString(), emp.password);
        if (!validate)
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_PASSWORD);
        let tokenData = await TokenManager.setToken({
            _id: emp._id,
            type: Config.APP_CONSTANTS.DATABASE.USER_TYPE.EMPLOYEE
        });
        emp.accessToken = tokenData.accessToken;
        delete emp.password;
        return emp
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//Employee Forgot Password
async function empForgotPassword(payloadData) {
    try {
        let criteria = false;
        if (payloadData.email) {
            criteria = { email: payloadData.email }
        }
        const emp = await Service.findOne(Model.Employee, criteria, {}, { new: true, lean: true });
        if (!emp) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_PHONE_EMAIL);
        }
        let verificationCode = await CodeGenerator.generateCode(6, "numeric");
        let otpData = {
            code: verificationCode,
            type: Config.APP_CONSTANTS.DATABASE.OTP_TYPE.FORGOT_PASSWORD
        }
        console.log("Otp Data:" + otpData);
        if (payloadData.email) {
            otpData.email = payloadData.email;
            const body = Config.APP_CONSTANTS.SERVER.otpEmail.body.replace(
                "{otp}",
                verificationCode
            );

            // let email = await emailFunction.sendEmail(
            //     payloadData.email,
            //     Config.APP_CONSTANTS.SERVER.otpEmail.subject,
            //     body,
            //     []
            // );
        }

        const data = await Service.findAndUpdate(
            Model.OtpCode,
            { email: payloadData.email },
            { $set: { ...otpData } },
            { upsert: true }
        );

        return {
            statuCode: 200,
            customMassage: "Otp send On Email",
            type: "OTP_SEND_ON_EMAIl"
        }

        return emp
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
    }
}

//Employee Otp Verify
async function empverifyOTP(payloadData) {
    try {
        const { code, email } = payloadData;
        const data = await Service.findOne(Model.OtpCode, {
            email: email,
            code: code,
            status: 1,
            type: Config.APP_CONSTANTS.DATABASE.OTP_TYPE.FORGOT_PASSWORD
        });
        if (!data) return { valid: false };
        return { valid: true }
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//Employee Change Password
async function empChangePassword(payloadData) {
    try {
        const {
            STATUS_MSG: {
                SUCCESS: { UPDATED },
                ERROR: { IMP_ERROR, INVALID_OTP },
            },
            DATABASE: {
                USER_TYPE: { EMPLOYEE },
                OTP_TYPE: { FORGOT_PASSWORD },
            },
        } = Config.APP_CONSTANTS;
        const { email, code, password } = payloadData;
        const otpObj = await Service.findAndUpdate(
            Model.OtpCode,
            { email: email, code: code, status: 1, type: FORGOT_PASSWORD },
            { lean: true }
        );
        if (!otpObj) {
            return Promise.reject(INVALID_OTP);
        }
        const emp = await Service.findAndUpdate(Model.Employee,
            { email: email },
            {
                $set: {
                    password: await UniversalFunctions.CryptData(password)
                }
            },
            { lean: true }
        );
        if (emp) {
            let tokenData = await TokenManager.setToken({
                _id: emp._id,
                type: EMPLOYEE
            });
            return UPDATED
        }
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//View Profile 
async function viewProfile(userData) {
    try {
        const data = await Service.findOne(Model.Employee, { _id: userData._id })
        if (!data) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
        }
        // emp = JSON.parse(JSON.stringify(emp));
        delete data.password
        return data
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//Employee Profile Update
async function empProfileUpdate(payloadData, userData) {
    try {
        if (await Service.findOne(Model.Employee, { email: payloadData.email, _id: { $ne: userData._id } })) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.EMAIL_ALREADY_EXIST)
        }
        if (await Service.findOne(Model.Employee, { email: payloadData.mobile, _id: { $ne: userData._id } })) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.MOBILE_ALREADY_EXIST)
        }
        payloadData.password = await UniversalFunctions.CryptData(payloadData.password);
        const update = await Service.findAndUpdate(Model.Employee, { _id: userData._id }, payloadData);
        if (!update) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
        }
        else {
            return Config.APP_CONSTANTS.STATUS_MSG.SUCCESS.UPDATED
        }
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//Employee Apply For Leave 
async function applyLeave(payloadData, userData) {
    try {
        payloadData.applicantID = userData._id;

        let diff;
        if (!payloadData.endDate) {
            payloadData.endDate = payloadData.startDate
            diff = 1;
        } else {
            diff = moment(payloadData.endDate).diff(moment(payloadData.startDate), 'days');
            console.log("diff:", diff);
        }
        payloadData.period = diff;

        let data = await Service.saveData(Model.Leave, payloadData);
        if (!data) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
        }
        return data;
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//All Applied Laves
async function viewAppliedLeaves(queryData, userData) {
    try {
        const { skip = undefined, limit = undefined, search } = queryData;
        const query = { isDeleted: false, applicantID: userData._id };
        const projection = { isDeleted: 0, password: 0, accessToken: 0, __v: 0 };
        const options = { sort: { _id: -1 } }
        if (typeof skip !== "undefined" && limit !== "undefined") {
            options = { skip: skip, limit: limit, sort: { _id: -1 } }
        }

        let data = await Service.getData(Model.Leave, query, projection, options);
        let total = await Service.count(Model.Leave, query);

        return {
            LeaveData: data,
            TotalLeave: total
        }
    }
    catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//View All Project
async function allProject(queryData) {
    try {
        const { skip = undefined, limit = undefined, search } = queryData;
        const query = { isDeleted: false };
        const projection = { isDeleted: 0, __v: 0 };
        const options = { sort: { _id: -1 } }

        if (typeof skip !== "undefined" && typeof limit !== "undefined") {
            options = { skip: skip, limit: limit, sort: { _id: -1 } }
        }

        const data = await Service.getData(Model.Project, query, projection, options);
        const total = await Service.count(Model.Project, query)

        return {
            ProjectData: data,
            TotalProject: total
        }
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//Employee Working Project List 
async function empWorkingProject(queryData, userData) {
    try {

        const data = await Model.Employee.aggregate([
            {
                $match: { _id: userData._id }
            },
            {
                $lookup: {
                    from: "projects",
                    localField: "_id",
                    foreignField: "employeeId",
                    as: "project_Info",
                },
            },
            {
                $unwind: "$project_Info"
            },
            // {
            //     $project: {
            //         title: 1
            //     }
            // }
        ])

        return data

        // const { skip = undefined, limit = undefined, search } = queryData;
        // const condition = { isDeleted: false, _id: userData._id }

        // const aggregate = [
        //     { $match: { ...condition } }
        // ];

        // if (typeof skip !== "undefined" && typeof limit !== "undefined") {
        //     aggregate.push({ $skip: skip }, { $limit: limit }, { $sort: sorting })
        // }

        // aggregate.push(
        //     {
        //         $lookup: {
        //             from: "projects",
        //             let: { "employeeId": "_id" },
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: {
        //                             $and: [
        //                                 { eq: ["$employeeId", "$$employeeId"] }
        //                             ]
        //                         }
        //                     }
        //                 },
        //                 {
        //                     $project: {
        //                         title: 1
        //                     }
        //                 }
        //             ],
        //             as: "ProjectData"
        //         }
        //     },
        //     {
        //         $unwind: { path: "$ProjectData", preserveNullAndEmptyArrays: true }
        //     }
        // )

        // const data = await Model.Employee.aggregate(aggregate)
        // return data
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//view Task
async function viewTask(queryData, userData) {
    try {

        const data = await Model.Employee.aggregate([
            {
                $match: { _id: userData._id }
            },
            {
                $lookup: {
                    from: "tasks",
                    localField: "_id",
                    foreignField: "employeeId",
                    as: "Task_Info"
                },
            },
            {
                $unwind: "$Task_Info"
            },
            {
                $project: {
                    firstName: 1,
                    lastName: 1,
                    email: 1,
                    password: 1,
                    mobile: 1,
                    department: 1,
                    taskInfo: "$Task_Info"
                }
            },
            {
                $group: {
                    _id: null,
                    firstName: { $first: "$firstName" },
                    lastName: { $first: "$lastName" },
                    email: { $first: "$email" },
                    taskInfo: { $addToSet: "$taskInfo" }
                }
            }
        ])
        return data
        // const { skip = undefined, limit = undefined, search } = queryData;
        // const condition = { isDeleted: false, _id: userData._id }

        // const aggregate = [
        //     { $match: { ...condition } }
        // ];

        // if (typeof skip !== "undefined" && typeof limit !== "undefined") {
        //     aggregate.push({ $skip: skip }, { $limit: limit }, { $sort: sorting })
        // }

        // aggregate.push(
        //     {
        //         $lookup: {
        //             from: "employees",
        //             let: { "employee": "_id" },
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: {
        //                             $and: [
        //                                 { eq: ["$employeeId", "$$employee"] }
        //                             ]
        //                         }
        //                     }
        //                 },
        //                 {
        //                     $project: {
        //                         firstName: 1
        //                     }
        //                 }
        //             ],
        //             as: "EmployeeData"
        //         }
        //     },
        //     {
        //         $unwind: { path: "$EmployeeData", preserveNullAndEmptyArrays: true }
        //     }
        // )

        // const data = await Model.Task.aggregate(aggregate)
        // return data
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//Working Timer
async function taskTimer(payloadData, userData) {
    try {
        let data;
        payloadData.addedBy = userData._id;
        if (payloadData.taskTimerId) {
            data = await Service.findAndUpdate(Model.TaskTimer, { _id: payloadData.taskTimerId }, payloadData, { new: true, lean: true });
            if (data !== null) return Config.APP_CONSTANTS.STATUS_MSG.SUCCESS.UPDATED
            return Config.APP_CONSTANTS.STATUS_MSG.ERROR.NOT_EXIST
        } else {
            const condition = { taskId: payloadData.taskId, projectId: payloadData.projectId, employeeId: payloadData.addedBy }
            const find = await Service.findOne(Model.Task, condition)
            if (find) {
                data = await Service.saveData(Model.TaskTimer, payloadData)
                console.log("data:", data);
                if (!data) {
                    return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
                }
            }
            else {
                return Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR
            }
        }
        return data;
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//Change Task Status
async function changeStatus(payloadData) {
    try {
        // const find = await Service.findOne(Model.TaskTimer, { taskId: payloadData.taskId });
        // console.log("find:", find);

        const data = await Service.findAndUpdate(Model.Task, { _id: payloadData.taskId },
            {
                $set: {
                    status: payloadData.status
                }
            }, { new: true, lean: true })

        if (!data) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.NOT_EXIST)
        } else {
            return data
        }
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

module.exports = {
    employeeLogin,
    empForgotPassword,
    empverifyOTP,
    empChangePassword,
    viewProfile,
    empProfileUpdate,
    applyLeave,
    viewAppliedLeaves,
    allProject,
    empWorkingProject,
    viewTask,
    taskTimer,
    changeStatus
}