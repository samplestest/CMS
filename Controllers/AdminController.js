"use strict"

const Service = require("../Services").queries;
const UniversalFunctions = require("../Utils/UniversalFunction");
const Config = require("../Config");
const Model = require("../Models");
const TokenManager = require("../Lib/TokenManager");
const CodeGenerator = require("../Lib/CodeGenerator");
const emailFunction = require("../Lib/email");
const { payload } = require("@hapi/hapi/lib/validation");
const generator = require("generate-password");
const Services = require("../Services");
const { Project } = require("../Models");
const cron = require('node-cron');
const moment = require('moment');
const nodemailer = require('nodemailer');
const { format } = require("path");
const webPush = require('web-push');

//Admin Register
async function adminRegister(payloadData) {
    try {
        if (await Service.findOne(Model.User, { email: payloadData.email })) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
        }
        if (await Service.findOne(Model.Admin, { email: payloadData.email })) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
        }
        const password = await UniversalFunctions.CryptData(payloadData.password);
        payloadData.password = password;
        payloadData.role = "Admin"
        let admin = await Service.saveData(Model.Admin, payloadData);
        if (!admin) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
        }
        admin = JSON.parse(JSON.stringify(admin));
        delete admin.password
        return admin
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//Admin Login
async function adminLogin(payloadData) {
    try {
        // let admin = await Service.findOnePopulateData(Model.Admin, { email: payloadData.email }, {},
        //     { new: true })
        // [
        //     {
        //         path: "permissions",
        //         options: { sort: ["index"] },
        //         select: "name childs index icon",
        //         model: "Module",
        //     },
        // ])

        let admin = await Service.findOne(Model.Admin, { email: payloadData.email })
        if (!admin) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
        }
        if (admin.isBloked) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.BLOCKED)
        }
        const validate = await UniversalFunctions.comparePassword(payloadData.password.toString(), admin.password);
        if (!validate) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_PASSWORD)
        }
        const tokenData = await TokenManager.setToken(
            {
                _id: admin._id,
                type: Config.APP_CONSTANTS.DATABASE.USER_TYPE.ADMIN
            }
        );
        admin.accessToken = tokenData.accessToken;
        admin = JSON.parse(JSON.stringify(admin))
        delete admin.password
        return admin;
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}


//Admin Forgot Password
async function forgotPassword(payloadData) {
    try {
        let criteria = false;
        if (payloadData.email) {
            criteria = { email: payloadData.email };
        }
        let user = await Service.findOne(Model.Admin, criteria, {}, { lean: true });
        if (!user)
            return Promise.reject(
                Config.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_PHONE_EMAIL
            );

        const verificationCode = await CodeGenerator.generateCode(6, "numeric");
        // const verificationCode = '123456';
        let otpData = {
            code: verificationCode,
            type: Config.APP_CONSTANTS.DATABASE.OTP_TYPE.FORGOT_PASSWORD,
        };
        if (payloadData.email) {
            otpData.email = payloadData.email;
            const body = Config.APP_CONSTANTS.SERVER.otpEmail.body.replace(
                "{otp}",
                verificationCode
            );
            let email = emailFunction.sendEmail(
                payloadData.email,
                Config.APP_CONSTANTS.SERVER.otpEmail.subject,
                body,
                []
            );
        }

        const data = await Service.findAndUpdate(
            Model.OtpCode,
            { email: payloadData.email },
            { $set: { ...otpData } },
            { upsert: true }
        );

        return {
            statusCode: 200,
            customMessage: "OTP Sent on Email",
            type: "OTP_SENT_ON_EMAIL",
        };
    }
    catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
    }
}

//Verify OTP
async function verifyOTP(payloadData) {
    try {
        const { email, code } = payloadData;
        let data = await Service.findOne(Model.OtpCode, {
            email: email,
            code: code,
            status: 1,
            type: Config.APP_CONSTANTS.DATABASE.OTP_TYPE.FORGOT_PASSWORD
        })
        if (!data) return { valid: false }
        else return { valid: true }
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//admin change password
async function changePassword(payloadData) {
    try {
        const {
            STATUS_MSG: {
                SUCCESS: { UPDATED },
                ERROR: { IMP_ERROR, INVALID_OTP },
            },
            DATABASE: {
                USER_TYPE: { ADMIN },
                OTP_TYPE: { FORGOT_PASSWORD },
            },
        } = Config.APP_CONSTANTS;
        const { email, code, password } = payloadData;

        let otpObj = await Service.findAndUpdate(
            Model.OtpCode,
            { email: email, code: code, status: 1, type: FORGOT_PASSWORD },
            { lean: true }
        );
        if (!otpObj) return Promise.reject(INVALID_OTP);
        const user = await Service.findAndUpdate(
            Model.Admin,
            { email: email, role: ADMIN },
            {
                $set: {
                    password: await UniversalFunctions.CryptData(password),
                },
            },
            { lean: true, new: true }
        );
        if (user) {
            const tokenData = await TokenManager.setToken({
                _id: user._id,
                type: ADMIN,
            });
            return UPDATED;
        }
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
    }
}

//Add Edit SubAdmin
async function addEditSubAdmin(payloadData, userData) {
    try {
        let tokenData = null;
        payloadData.role = "SUBADMIN",
            payloadData.addedBy = userData._id

        if (payloadData.subAdminId) {
            let data = await Service.findAndUpdate(
                Model.Admin,
                { _id: payloadData.subAdminId },
                payloadData
            );
            delete data.password
            tokenData = await TokenManager.setToken({
                _id: data._id,
                type: Config.APP_CONSTANTS.DATABASE.USER_TYPE.ADMIN
            });
            if (data !== null) return Config.APP_CONSTANTS.STATUS_MSG.SUCCESS.UPDATED;
            else return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.NOT_EXIST);
        } else {
            if (await Service.findOne(Model.Admin, { email: payloadData.email })) {
                return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.EXIST)
            }
            // let password = await generatePassword();
            payloadData.password = await UniversalFunctions.CryptData(payloadData.password)
            const data = await Service.saveData(Model.Admin, payloadData);
            const body = `<b>Welcome,${payloadData.fullName}</b><p>Here's Your Login Information: </p>
            <p><b>Email:</b>${payloadData.email}</p>
            <p><b>password:</b>${payloadData.password}</p>`
            emailFunction.sendEmail(
                payloadData.email,
                Config.APP_CONSTANTS.SERVER.Login.subject,
                body,
                []
            );

            if (data !== null) return Config.APP_CONSTANTS.STATUS_MSG.SUCCESS.CREATED;
            else return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.DB_ERROR);
        }
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//Generate Password
async function generatePassword() {
    let password = generator.generate({
        length: 8,
        numbers: true
    });
    return password
}

//Fetch Subadmin
async function fetchSubadmin(payloadData, userData) {
    try {
        const { skip = undefined, limit = undefined, search, isBlocked = undefined, invite = undefined } = payloadData;
        let query = { isDelete: false, role: "SUBADMIN" };
        if (typeof isBlocked !== "undefined")
            query.isBlocked = isBlocked;
        if (typeof invite !== "undefined")
            query.invite = invite;
        let projection = { isDelete: 0, password: 0, accessToken: 0, __v: 0 };
        let options = { sort: { _id: -1 } };
        if (typeof skip !== "undefined" && typeof limit !== "undefined")
            options = { skip: skip, limit: limit, sort: { _id: -1 } };
        if (search)
            query.fullName = new RegExp(search, "ig");
        let data = await Service.getData(Model.Admin, query, projection, options);
        let total = await Service.count(Model.Admin, query);
        return {
            subadminData: data,
            total: total
        }
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//Block Subadmin 
async function subAdminStatusChangeBlock(paramsData) {
    try {
        let find = await Service.findOne(Model.Admin, { _id: paramsData.subAdminId })
        if (!find) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
        }
        let isBloked
        if (find.isBlocked)
            isBloked = false
        else
            isBloked = true
        let data = await Service.findAndUpdate(Model.Admin, { _id: paramsData.subAdminId }, { isBlocked: isBloked }, { new: true, lean: true });
        if (!data)
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
        if (isBloked)
            return Config.APP_CONSTANTS.STATUS_MSG.SUCCESS.SUBADMIN_BLOCK
        else
            return Config.APP_CONSTANTS.STATUS_MSG.SUCCESS.SUBADMIN_UNBLOCK
    } catch (err) {
        console.log(err);
        return Promise.reejct(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//SubAdmin Change Password
async function subAdminChangePassword(payloadData, userData) {
    try {
        const {
            STATUS_MSG: {
                SUCCESS: { UPDATED },
                ERROR: { IMP_ERROR, INVALID_OTP },
            },
            DATABASE: {
                USER_TYPE: { ADMIN },
                OTP_TYPE: { ADMIN_VERIFICATION },
            },
        } = Config.APP_CONSTANTS;
        const { password } = payloadData;
        let admin = await Service.findAndUpdate(
            Model.Admin,
            { _id: userData._id, role: "SUBADMIN" },
            {
                $set: {
                    password: await UniversalFunctions.CryptData(password),
                    invite: true
                }
            },
            { lean: true, new: true }
        );
        if (admin) {
            let tokenData = await TokenManager.setToken({
                _id: userData._id,
                type: ADMIN
            });
            return UPDATED;
        }
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

// //Add Edit Department
// async function addDepartment(payloadData, userData) {
//     try {
//         if (payloadData.deptId) {
//             let data = await Service.findAndUpdate(Model.Department,
//                 { _id: payloadData.deptId },
//                 payloadData
//             );

//             if (data !== null) return Config.APP_CONSTANTS.STATUS_MSG.SUCCESS.UPDATED
//             else Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
//         } else {
//             if (await Service.findOne(Model.Department, { deptName: payloadData.deptName }, { lean: true, new: true })) {
//                 return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.DEPARTMENT_ALREADY_EXIT)
//             }
//             payloadData.addedBy = userData._id;
//             let code = await CodeGenerator.generateCode(4, "numeric");
//             payloadData.deptNo = code;
//             let dept = await Service.saveData(Model.Department, payloadData);
//             if (!dept)
//                 return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
//             return dept;
//         }
//     } catch (err) {
//         console.log(err);
//         return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
//     }
// }

// //Fetch department 
// async function fetchDepartment(payloadData) {
//     try {
//         const { skip = undefined, limit = undefined, search } = payloadData;
//         const query = { isDelete: false };
//         const projection = { isDelete: 0 };
//         const options = { sort: { _id: -1 } }
//         if (typeof skip !== "undefined" && typeof limit !== "undefined")
//             options = { skip: skip, limit: limit, sort: { _id: -1 } };
//         if (search)
//             query.fullName = new RegExp(search, "ig");
//         const data = await Service.getData(Model.Department, query, projection, options);
//         const total = await Service.count(Model.Department, query);

//         return {
//             DepartmentData: data,
//             Total: total
//         }
//     } catch (err) {
//         console.log(err);
//         return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
//     }
// }

//Add Edit Employee
async function addEditEmployee(payloadData, userData) {
    try {
        if (payloadData.employeeId) {
            let data = await Service.findAndUpdate(Model.Employee,
                { _id: payloadData.employeeId },
                payloadData
            );

            if (data !== null) return Config.APP_CONSTANTS.STATUS_MSG.SUCCESS.UPDATED
            else Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
        } else {
            if (await Service.findOne(Model.Employee, { email: payloadData.email })) {
                return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.EXIST)
            }
            if (await Service.findOne(Model.Admin, { email: payloadData.email })) {
                return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.EXIST)
            }
            let password = await UniversalFunctions.CryptData(payloadData.password);
            payloadData.password = password;
            const emp = await Service.saveData(Model.Employee, payloadData);
            return emp;
        }
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//Employee List
async function employeeList(payloadData) {
    try {
        const { skip = undefined, limit = undefined, search } = payloadData;
        const query = { isDeleted: false };
        const projection = { isDelete: 0 };
        const options = { sort: { _id: -1 } };
        if (typeof skip !== "undefined" && typeof limit !== "undefined")
            options = { skip: skip, limit: limit, sort: { _id: -1 } };
        if (search)
            query.fullName = new RegExp(search, "ig");
        const data = await Service.getData(Model.Employee, query, projection, options)
        const total = await Service.count(Model.Employee, query)

        return {
            EmployeeData: data,
            Total: total
        }
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//Employee Blocked Status
async function employeeStatusChange(paramsData) {
    try {
        const find = await Service.findOne(Model.Employee, { _id: paramsData.employeeId })
        if (!find) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
        }
        let isBlocked
        if (find.isBlocked)
            isBlocked = false
        else
            isBlocked = true
        const data = await Service.findAndUpdate(Model.Employee, { _id: paramsData.employeeId }, { isBlocked: isBlocked }, { lean: true, new: true })
        if (!data) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
        }
        if (isBlocked)
            return Config.APP_CONSTANTS.STATUS_MSG.SUCCESS.EMPLOYEE_BLOCK
        else
            return Config.APP_CONSTANTS.STATUS_MSG.SUCCESS.EMPLOYEE_UNBLOCK

    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//Employee Delete
async function employeeRemove(paramsData) {
    try {
        const { employeeId } = paramsData;
        const resp = await Service.findAndUpdate(Model.Employee, { _id: employeeId }, { $set: { isDeleted: true } })
        if (resp)
            return Config.APP_CONSTANTS.STATUS_MSG.SUCCESS.DELETED
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.NOT_EXIST)
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//Fetch Employee Apply leave List
async function applyLeaveList(queryData) {
    try {
        const { skip = undefined, limit = undefined, search } = queryData;
        const condition = { isDeleted: false };

        const aggregate = [
            { $match: { ...condition } }
        ];
        if (typeof skip !== "undefined" && limit !== "undefined") {
            aggregate.push({ $skip: skip }, { $limit: limit }, { $sort: sorting })
        }

        aggregate.push(
            {
                $lookup: {
                    from: "employees",
                    let: { "employeeId": "$applicantID" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$_id", "$$employeeId"] }
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                firstName: 1,
                                lastName: 1,
                                email: 1,
                                mobile: 1,
                                department: 1
                            }
                        }
                    ],
                    as: "EmployeeData"
                }
            },
            {
                $unwind: { path: "$EmployeeData", preserveNullAndEmptyArrays: true }
            }
        )

        const data = Model.Leave.aggregate(aggregate);
        return data;
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//Respond Leave Application
async function respondApplication(payloadData) {
    try {
        const find = await Service.findOne(Model.Leave, { _id: payloadData.leaveId });
        if (!find) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.NOT_EXIST)
        };
        const resp = await Service.findAndUpdate(Model.Leave, { _id: payloadData.leaveId }, { adminResponse: payloadData.response });
        if (!resp) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
        }
        else {
            return Config.APP_CONSTANTS.STATUS_MSG.SUCCESS.REPONSE_ADD
        }
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//Set Employee Salary Base on Employee Leave 
async function setSalary(payloadData, userData) {
    try {
        // const date = new Date();
        const dayInMonth = new Date(payloadData.year, payloadData.month, 0).getDate();
        console.log("Day in Month :" + dayInMonth);

        const emp = await Service.findOne(Model.Employee, { _id: payloadData.employeeId, isDeleted: false, isBlocked: false });
        const basic = emp.salary;
        console.log("Basic Salary :" + basic);

        const dayWiseSalary = basic / dayInMonth;
        console.log("Day Wise salary:" + dayWiseSalary);

        const leave = await Service.findOne(Model.Leave, { applicantID: payloadData.employeeId });
        console.log("leave:", leave);
        // const month = new Date(leave.startDate).getMonth() + 1;
        // console.log("Month:" + month);

        const monthLeave = leave.date.length;
        console.log("Month Leave :" + monthLeave);
        // let arr = [];
        for (let index = 0; index < leave.date.length; index++) {
            const element = leave.date[index]

            const month = new Date(element).getMonth() + 1;


            console.log("Month:" + month);


            console.log("element:" + element);
        }

        // if (month == payloadData.month) {

        const paidSalaey = basic / dayInMonth - monthLeave;
        console.log("PaidSalary Salary:" + paidSalaey);

        const salary = basic - paidSalaey;
        console.log("Employee Salary:" + salary);

        return salary
        // } else {
        //     return basic
        // }
        // return dayInMonth
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
    }
}

//Set Employee Sallery 
async function monthWiseSallery(queryData) {
    try {
        const dayInMonth = new Date(queryData.year, queryData.month, 0).getDate();
        console.log("dayInMonth:", dayInMonth);
        let obj = {};
        let emp = await Service.getData(Model.Employee);
        console.log("emp:", emp);
        await emp.map(async (item) => {
            const empId = item._id;
            const salary = item.salary;
            Object.assign(obj, { empId: empId, salary: salary });
            console.log("id:", empId + "salary:", salary);
            const dayWiseSalary = salary / dayInMonth;
            console.log("dayWiseSalary:", dayWiseSalary)
            const condition = { isDeleted: false, applicantID: empId }
            let leave = await Service.getData(Model.Leave, condition);
            console.log("leave:", leave);
            // console.log("obj:", obj);
        })

        return {
            data: obj
        }

    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
    }
}


//Set Employee Sallery Using Aggregate
async function monthWiseSalleryAgg(queryData) {
    try {
        const { skip = undefined, limit = undefined, search, year, month, employeeId } = queryData;
        const condition = { isDeleted: false };

        const currdate = new Date(year, month, 0).getDate();
        console.log("currdate:", currdate);
        const formate = new Date(year, month);
        console.log("formate:", formate);

        const aggregate = [
            { $match: { ...condition } }
        ];
        if (typeof skip !== "undefined" && limit !== "undefined") {
            aggregate.push({ $skip: skip }, { $limit: limit }, { $sort: sorting })
        }

        aggregate.push(
            {
                $lookup: {
                    from: "leaves",
                    let: { "employeeId": "$_id" },
                    pipeline: [
                        {
                            $unwind: { path: "$date", preserveNullAndEmptyArrays: true }
                        },
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$applicantID", "$$employeeId"] },
                                        { $eq: [{ $month: "$startDate" }, { $month: new Date(formate) }] },
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                applicantID: 1,
                                title: 1,
                                appliedDate: 1,
                                startDate: 1,
                                endDate: 1,
                                // date: 1,
                                period: 1,
                                leaves: {
                                    $map: {
                                        input: {
                                            $range: [0, { $subtract: [{ $add: [1, "$endDate"] }, "$startDate"] }, 1000 * 60 * 60 * 24]
                                        },
                                        in: {
                                            $add: ["$startDate", "$$this"]
                                        }
                                    }
                                },
                                monthLeave: {
                                    $map: {
                                        input: {
                                            $range: [0, { $subtract: [{ $add: [1, { $cond: { if: { $lte: ["$endDate", formate] }, then: "$endDate", else: formate } }] }, "$startDate"] }, 1000 * 60 * 60 * 24],
                                            // $add: [1, { $cond: { if: { $lte: ["$endDate", formate] }, then: "$endDate", else: 2 } }]
                                        },
                                        in: {
                                            $add: ["$startDate", "$$this"]
                                        }
                                    }
                                },

                            }
                        },
                    ],
                    as: "LeaveData"
                }
            },
            {
                $unwind: { path: "$LeaveData", preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    _id: 1,
                    firstName: 1,
                    salary: 1,
                    LeaveData: 1,
                    monthTotalLeave: {
                        $cond: { if: { $isArray: "$LeaveData.monthLeave" }, then: { $size: "$LeaveData.monthLeave" }, else: "NA" },
                        // $size: { "$ifNull": ["$monthLeave", []] }
                    },
                }
            },
            {
                $group: {
                    _id: "$_id",
                    firstName: { "$first": "$firstName" },
                    salary: { "$first": "$salary" },
                    LeaveData: { "$addToSet": "$LeaveData" },
                    totalLeave: { $sum: "$LeaveData.period" },
                    monthTotalLeave: { "$sum": "$monthTotalLeave" },
                }
            },
            {
                $set: {
                    monthTotalDay: currdate,
                    preDay: { $subtract: [currdate, "$monthTotalLeave"] },
                    dayWiseSalary: { $divide: ["$salary", currdate] },
                    leaveDaySalary: { $multiply: [{ $divide: ["$salary", currdate] }, "$monthTotalLeave"] },
                    finalSalary: { $multiply: [{ $divide: ["$salary", currdate] }, { $subtract: [currdate, "$monthTotalLeave"] }] },
                    // paidSalary: {
                    //     $subtract: ["$salary", { $divide: ["$salary", { $subtract: [currdate, "$monthTotalLeave"] }] }]
                    // },
                }
            }

        );

        const data = await Model.Employee.aggregate(aggregate);
        console.log("data:", data);
        return data

    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
    }
}

//Set Employee Sallery Using Aggregate
async function monthWiseSalleryAggNotify(queryData) {
    try {
        // const { skip = undefined, limit = undefined, search } = queryData;
        // const f = new Date(y, -1, d);

        const now = moment(new Date()).subtract(1, 'months').format('YYYY/MM/DD');
        console.log("now:", now);
        const date = new Date(now);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        console.log("year:", year + "month:", month);

        const condition = { isDeleted: false };

        const currdate = new Date(year, month, 0).getDate();
        console.log("currdate:", currdate);
        const formate = new Date(year, month);
        console.log("formate:", formate);

        const aggregate = [
            { $match: { ...condition } }
        ];
        if (typeof skip !== "undefined" && limit !== "undefined") {
            aggregate.push({ $skip: skip }, { $limit: limit }, { $sort: sorting })
        }

        aggregate.push(
            {
                $lookup: {
                    from: "leaves",
                    let: { "employeeId": "$_id" },
                    pipeline: [
                        {
                            $unwind: { path: "$date", preserveNullAndEmptyArrays: true }
                        },
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$applicantID", "$$employeeId"] },
                                        { $eq: [{ $month: "$startDate" }, { $month: new Date(formate) }] },
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                applicantID: 1,
                                title: 1,
                                appliedDate: 1,
                                startDate: 1,
                                endDate: 1,
                                // date: 1,
                                period: 1,
                                leaves: {
                                    $map: {
                                        input: {
                                            $range: [0, { $subtract: [{ $add: [1, "$endDate"] }, "$startDate"] }, 1000 * 60 * 60 * 24]
                                        },
                                        in: {
                                            $add: ["$startDate", "$$this"]
                                        }
                                    }
                                },
                                monthLeave: {
                                    $map: {
                                        input: {
                                            $range: [0, { $subtract: [{ $add: [1, { $cond: { if: { $lte: ["$endDate", formate] }, then: "$endDate", else: formate } }] }, "$startDate"] }, 1000 * 60 * 60 * 24],
                                            // $add: [1, { $cond: { if: { $lte: ["$endDate", formate] }, then: "$endDate", else: 2 } }]
                                        },
                                        in: {
                                            $add: ["$startDate", "$$this"]
                                        }
                                    }
                                },

                            }
                        },
                    ],
                    as: "LeaveData"
                }
            },
            {
                $unwind: { path: "$LeaveData", preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    _id: 1,
                    firstName: 1,
                    salary: 1,
                    LeaveData: 1,
                    monthTotalLeave: {
                        $cond: { if: { $isArray: "$LeaveData.monthLeave" }, then: { $size: "$LeaveData.monthLeave" }, else: "NA" },
                        // $size: { "$ifNull": ["$monthLeave", []] }
                    },
                }
            },
            {
                $group: {
                    _id: "$_id",
                    firstName: { "$first": "$firstName" },
                    salary: { "$first": "$salary" },
                    LeaveData: { "$addToSet": "$LeaveData" },
                    totalLeave: { $sum: "$LeaveData.period" },
                    monthTotalLeave: { "$sum": "$monthTotalLeave" },
                }
            },
            {
                $set: {
                    month: month,
                    year: year,
                    monthTotalDay: currdate,
                    preDay: { $subtract: [currdate, "$monthTotalLeave"] },
                    dayWiseSalary: { $divide: ["$salary", currdate] },
                    leaveDaySalary: { $multiply: [{ $divide: ["$salary", currdate] }, "$monthTotalLeave"] },
                    finalSalary: { $multiply: [{ $divide: ["$salary", currdate] }, { $subtract: [currdate, "$monthTotalLeave"] }] },
                    // paidSalary: {
                    //     $subtract: ["$salary", { $divide: ["$salary", { $subtract: [currdate, "$monthTotalLeave"] }] }]
                    // },
                }
            }

        );

        const data = await Model.Employee.aggregate(aggregate);
        // console.log("data:", data);
        await data.map(async (item) => {
            const record = item;
            console.log("Record:", record);
            let obj = {
                employeeId: item._id,
                employeeName: item.firstName,
                salary: item.salary,
                salaryDetail: [{
                    month: item.month,
                    year: item.year,
                    monthTotalLeave: item.monthTotalLeave,
                    paidSalary: item.finalSalary
                }]
            }
            console.log("obj:", obj);
            const exit = await Service.findOne(Model.Salary,
                {
                    employeeId: item._id,
                    salaryDetail: {
                        $elemMatch:
                        {
                            month: item.month,
                            year: item.year,
                        }
                    }
                }
            );
            // console.log("exit:", exit);
            if (exit) {
                return Config.APP_CONSTANTS.STATUS_MSG.ERROR.EXIST
            }
            else {
                const find = await Service.findAndUpdate(Model.Salary, { employeeId: obj.employeeId },
                    {
                        $push: { salaryDetail: obj.salaryDetail }
                    })
                // console.log("find:", find);
                if (find) {
                    return Config.APP_CONSTANTS.STATUS_MSG.SUCCESS.UPDATED
                } else {
                    const salary = await Service.saveData(Model.Salary, obj);
                    // console.log("salary:", salary);
                    return salary
                }
            }
        })
        // return data
    }
    catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
    }
}

//Today Employee Birthday List
async function todayBirthDayList(payloadData) {
    try {
        // get all emp
        let empData = await Service.getData(Model.Employee);
        let temp = [];
        empData.map((item) => {
            let bdate = new Date(item.DOB);
            let curDate = new Date();
            let month = curDate.getMonth() + 1;
            let date = curDate.getDate();
            if (((bdate.getMonth() + 1) === month) && ((bdate.getDate()) === date)) {
                console.log("sdhsdfhksdf", item)
                temp.push(item)
            }
        })

        // const month = new Date(payloadData.DOB).getMonth() + 1;
        // console.log("Month:" + month);
        // const date = new Date(payloadData.DOB).getDate();
        // console.log("Date:" + date);

        // const data = await Service.findOne(Model.Employee, { DOB: payloadData.DOB })
        if (!temp) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.NOT_EXIST);
        } else {
            return temp;
        }
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
    }
}

//Today Employee Birthday List using Aggregate Function
async function todayEmpBirthdayList(queryData) {
    try {
        const { skip = undefined, limit = undefined, search } = queryData;

        if (typeof skip !== "undefined" && limit !== "undefined") {
            aggregate.push({ $skip: skip }, { $limit: limit }, { $sort: soring })
        }
        const condition = { isDeleted: false };

        const month = new Date(queryData.DOB).getMonth() + 1;
        console.log("Month:" + month);
        const date = new Date(queryData.DOB).getDate();
        console.log("Date:" + date);


        const aggregate = [
            { $match: { ...condition } },
            // {
            //     $project: {
            //         firstName: 1
            //     }
            // }
        ];

        aggregate.push(
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: [{ $month: '$DOB' }, { $month: new Date() }] }
                        ]
                    }
                }
            },
            {
                $project: {
                    firstName: 1
                }
            }
        )

        // aggregate.push(
        //     {
        //         $lookup: {
        //             from: "employees",
        //             let: { "employeeId": "$applicantID" },
        //             pipeline: [

        //                 {
        //                     $match: {
        //                         $expr: {
        //                             $eq: [{ $month: '$DOB' }, { $month: new Date() }]
        //                         }
        //                     }
        //                 },
        //                 {
        //                     $project: {
        //                         firstName: 1
        //                     }
        //                 }
        //             ],
        //             as: "BirthdayList"
        //         }
        //     }
        // )

        const data = Model.Employee.aggregate(aggregate);
        return data;
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//Today how Many Employee On Leave
async function empOnLeave(payloadData) {
    try {
        const { skip = undefined, limit = undefined, search } = payloadData;
        const query = { isDeleted: false, date: payloadData.todayDate };
        const projection = { isDelete: 0, __v: 0 };
        const options = { sort: { _id: -1 } }

        if (typeof skip !== "undefined" && limit !== "undefined") {
            options = { skip: skip, limit: limit, sort: { _id: -1 } }
        }

        const data = await Service.getData(Model.Leave, query, projection, options)
        const total = await Service.count(Model.Leave, query)

        return {
            TodayLeave: data,
            TotalLeave: total
        }
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
    }
}

//Add Edit Project
async function addEditProject(payloadData, userData) {
    try {
        payloadData.addedBy = userData._id;
        let data
        if (payloadData.projectId) {
            data = await Service.findAndUpdate(Model.Project, { _id: payloadData.projectId }, payloadData, { new: true, lean: true })
        } else {
            data = await Service.saveData(Model.Project, payloadData);
        }
        if (!data) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
        }
        return data
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//Fetch Project List
async function projectList(queryData) {
    try {
        const { skip = undefined, limit = undefined, search } = queryData;
        const condition = { isDeleted: false };

        const aggregate = [
            { $match: { ...condition } }
        ];

        if (typeof skip !== "undefined" && limit !== "undefined") {
            aggregate.push({ $skip: skip }, { $limit: limit }, { $sort: sorting })
        }

        aggregate.push(
            {
                $lookup: {
                    from: "employees",
                    let: { "employeeId": "$employeeId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$_id", "$$employeeId"] }
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                firstName: 1,
                                lastName: 1,
                                email: 1,
                                mobile: 1,
                                department: 1
                            }
                        }
                    ],
                    as: "EmployeeData"
                }
            },
            {
                $unwind: { path: "$EmployeeData", preserveNullAndEmptyArrays: true }
            }
        )

        // aggregate.push(
        //     {
        //         $lookup: {
        //             from: "employees",
        //             let: { "employeeId": "$employeeId" },
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: {
        //                             $and: [
        //                                 { $eq: ["$_id", "$$employeeId"] },
        //                                 { $eq: ["isDeleted", false] }
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

        const data = await Model.Project.aggregate(aggregate);
        return data
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//Cron After One Month Delete Record
async function cronData() {
    try {
        let date = new Date();
        console.log("date:", date);
        const d = date.getDate();
        const m = date.getMonth() + 1;
        const y = date.getFullYear();
        const formate = y + '-' + m + '-' + d;
        console.log("formate:", formate);
        const dayInMonth = new Date(y, m, 0).getDate();
        console.log("DayInMonth:", dayInMonth);
        // date.setDate(date.getDate() - 31);
        console.log("date2:", date);
        const curr2 = new Date(date.getFullYear(), date.getMonth() + 1, 1);
        console.log("curr2:", curr2);

        const data = await Service.getData(Model.Leave);
        await data.map((item) => {
            const createdAt = item.createdAt
            console.log("createdAt:", createdAt);
            const diff = moment(date).diff(moment(createdAt), 'days');
            date.setDate(date.getDate() - dayInMonth);
            console.log("date:", date);
            console.log("diff:", diff);
            if (diff == 30) {
                const list = Service.findAndUpdate(Model.Leave, {}, { isDeleted: true }, { new: true, lean: true });
                console.log("list:", list);
            }
        })
        // const data = await Service.getData(Model.Leave, { createdAt: date });
        // console.log("data:", data);
        // const temp = await Service.findAndUpdate(Model.Leave, { createdAt: { $lte: date } },
        //     {
        //         $set: { isDeleted: true }
        //     }, { new: true, lean: true });
        // console.log("temp:", temp);
        // const list = await Service.findAndUpdate(Model.Leave, { formate },
        //     {
        //         $set: {
        //             isDeleted: true
        //         }
        //     },
        //     { lean: true, new: true });

        // console.log("data:", data);
        cron.schedule('* * * * * *', () => {
            // console.log("running Every Min");
        })
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
    }
}

//Cron Deleted Data
async function removeData() {
    try {
        // cron.schedule('0 */12 * * *', async () => {
        const date = new Date();
        console.log("date:", date);

        const data = await Service.getData(Model.Leave);
        console.log("data:", data);
        let update;
        await data.map((item) => {
            const createdAt = item.createdAt;
            console.log("cretaedAt:", createdAt);
            const diff = moment(date).diff(moment(createdAt), 'days');
            console.log("diff:", diff);
            if (diff === 30 || diff === 31) {
                console.log("Data Deleted")
                date.setDate(date.getDate() - 31);
                console.log("setDate:", date);
                const condition = { createdAt: createdAt }
                update = Service.findAndUpdate(Model.Leave, condition,
                    {
                        $set: {
                            isDeleted: true
                        }
                    }, { new: true, lean: true });
            }
        })
        if (update) {
            return update;
        }
        // })
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//Send Email Using NodeMalier
async function emailDemo() {
    try {
        var transporter = nodemailer.createTransport({
            // host: 'smtp.gmail.com',
            // port: 587,
            // secure: false,
            // requireTLS: true,
            service: 'gmail',
            auth: {
                user: 'darshini.surbhiinfotech@gmail.com',
                pass: "aqjc iotm pohc gbep"
            }
        });
        var mailOptions = {
            from: 'darshini.surbhiinfotech@gmail.com',
            to: 'darshini.surbhiinfotech@gmail.com',
            subject: "Malier",
            text: "Hello"
        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            }
            else {
                console.log("Email Has Been Sent", info.response);
            }
        })
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
    }
}
//Web Push Example
async function webPushDemo(payloadData) {
    try {
        const subscription = payloadData
        const pushSubscription = {
            endpoint: '',
            keys: {
                auth: '',
                p256dh: ''
            }
        };
        const vapidKeys = webPush.generateVAPIDKeys();
        const publicVapidKey = vapidKeys.publicKey;
        const privateVapidKey = vapidKeys.privateKey;
        console.log("publicVapidKey:", publicVapidKey);
        console.log("privateVapidKey:", privateVapidKey);

        webPush.setVapidDetails("mailto:darshini.surbhiinfotech@gmail.com", publicVapidKey, privateVapidKey);

        const payload = JSON.stringify({ title: "Hello World", body: "This is your first push notification" });
        console.log("payload:", payload);

        // webPush.sendNotification(pushSubscription, payload).catch(console.log);

        const check = () => {
            if (!('serviceWorker' in navigator)) {
                throw new Error('No Service Worker support!')
            }
            if (!('PushManager' in window)) {
                throw new Error('No Push API Support!')
            }
        }

        const registerServiceWorker = async () => {
            const swRegistration = await global.navigator.serviceWorker.register(console.log('list'));
            return swRegistration;
        }

        const main = () => {
            check()
            const swRegistration = registerServiceWorker();
        }

        main()

    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
    }
}
module.exports = {
    adminRegister,
    adminLogin,
    forgotPassword,
    verifyOTP,
    changePassword,
    addEditSubAdmin,
    fetchSubadmin,
    subAdminStatusChangeBlock,
    subAdminChangePassword,
    // addDepartment,
    // fetchDepartment,
    addEditEmployee,
    employeeList,
    employeeStatusChange,
    employeeRemove,
    applyLeaveList,
    respondApplication,
    setSalary,
    monthWiseSallery,
    monthWiseSalleryAgg,
    monthWiseSalleryAggNotify,
    todayBirthDayList,
    empOnLeave,
    todayEmpBirthdayList,
    addEditProject,
    projectList,
    cronData,
    removeData,
    emailDemo,
    webPushDemo
}