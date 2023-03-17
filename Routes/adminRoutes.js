"use strict"
const { AdminController: Controller } = require("../Controllers");
const UniversalFunctions = require("../Utils/UniversalFunction");
const Joi = require("joi");
const Config = require("../Config");
const { config } = require("dotenv");
const { sendSuccess } = require("../Utils/UniversalFunction");

module.exports = [
    //Admin Register
    {
        method: "POST",
        path: "/admin/register",
        config: {
            handler: async function (request, h) {
                try {
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.adminRegister(request.payload)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e)
                }
            },
            description: "Admin Register API",
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    fullName: Joi.string().trim().required(),
                    userName: Joi.string().trim().required(),
                    email: Joi.string().trim().required(),
                    password: Joi.string().trim().required()
                }),
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-sawgger": {
                    payloadType: "from",
                    responses: Config.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    //Admin Login
    {
        method: "POST",
        path: "/admin/login",
        config: {
            handler: async function (request, h) {
                try {
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.adminLogin(request.payload)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e);
                }
            },
            description: "Admin Login API",
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    email: Joi.string().lowercase().trim().required(),
                    password: Joi.string().trim().required()
                }),
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-sawgger": {
                    payloadType: "from",
                    responses: Config.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    //Forgot Password
    {
        method: "POST",
        path: "/admin/forgot-password",
        config: {
            handler: async function (request, h) {
                try {
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.forgotPassword(request.payload)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e)
                }
            },
            description: "Admin Forgot Password API",
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    email: Joi.string().lowercase().trim().required()
                }),
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-sawgger": {
                    payloadType: "from",
                    responses: Config.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    //validate-otp
    {
        method: "POST",
        path: "/admin/verify-otp",
        config: {
            handler: async function (request, h) {
                try {
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.verifyOTP(request.payload)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e)
                }
            },
            description: "Admin Vertity Otp API ",
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    email: Joi.string().lowercase().trim().required(),
                    code: Joi.string().trim().required()
                })
            },
            plugins: {
                "hapi-sawgger": {
                    payloadType: "from",
                    responses: Config.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    //Change Password
    {
        method: "POST",
        path: "/admin/changePassword",
        config: {
            handler: async function (request, h) {
                try {
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.changePassword(request.payload)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e);
                }
            },
            description: "Admin Change Password API",
            auth: "AdminAuth",
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    email: Joi.string().lowercase().trim().required(),
                    code: Joi.string().trim().required(),
                    password: Joi.string().trim().required()
                }),
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-sawgger": {
                    payloadType: "from",
                    responses: Config.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    //Craete Subadmin
    {
        method: "POST",
        path: "/admin/create-subadmin",
        config: {
            handler: async function (request, h) {
                try {
                    const userData =
                        request.auth &&
                        request.auth.credentials
                    request.auth.credentials.userData
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.addEditSubAdmin(request.payload, userData)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e);
                }
            },
            description: "Create SubAdmin API",
            auth: "AdminAuth",
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    subAdminId: Joi.string().trim(),
                    fullName: Joi.string().trim().required(),
                    email: Joi.string().lowercase().trim().required(),
                    password: Joi.string().trim().required(),
                    mobile: Joi.string().trim().required()
                }),
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-sawgger": {
                    payloadType: "from",
                    responses: Config.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    //Fetch SubAdmin
    {
        method: "GET",
        path: "/admin/subadmin",
        config: {
            handler: async function (request, h) {
                try {
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.fetchSubadmin(request.query)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e)
                }
            },
            description: "Fetch Sub Admin API",
            auth: "AdminAuth",
            tags: ['api'],
            validate: {
                query: Joi.object({
                    skip: Joi.number(),
                    limit: Joi.number(),
                    search: Joi.string(),
                    isBlocked: Joi.boolean(),
                    invite: Joi.boolean()
                }),
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-sawgger": {
                    payloadType: "from",
                    responses: Config.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    //Blocked Subadmin 
    {
        method: "POST",
        path: "/admin/subadmin/{subAdminId}",
        config: {
            handler: async function (request, h) {
                try {
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.subAdminStatusChangeBlock(request.params)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e);
                }
            },
            description: "Subadmin Status Change API",
            auth: "AdminAuth",
            tags: ['api'],
            validate: {
                params: Joi.object({
                    subAdminId: Joi.string().trim().required()
                }),
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-sawgger": {
                    payloadType: "from",
                    responses: Config.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    //Change SubAdmin Password
    {
        method: "POST",
        path: "/admin/subadmin-change-password",
        config: {
            handler: async function (request, h) {
                try {
                    let userData =
                        request.auth &&
                        request.auth.credentials &&
                        request.auth.credentials.userData
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.subAdminChangePassword(request.payload, userData)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e);
                }
            },
            description: "Sub Admin Change Password API",
            auth: "AdminAuth",
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    password: Joi.string().trim().required()
                }),
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-sawgger": {
                    payloadType: "from",
                    response: Config.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    // //Add Edit Department
    // {
    //     method: "POST",
    //     path: "/admin/addDepartment",
    //     config: {
    //         handler: async function (request, h) {
    //             try {
    //                 const userData =
    //                     request.auth &&
    //                     request.auth.credentials &&
    //                     request.auth.credentials.userData
    //                 return await UniversalFunctions.sendSuccess(
    //                     null,
    //                     await Controller.addDepartment(request.payload, userData)
    //                 )
    //             } catch (e) {
    //                 console.log(e);
    //                 return await UniversalFunctions.sendError(e);
    //             }
    //         },
    //         description: "Add New Department API",
    //         auth: "AdminAuth",
    //         tags: ['api'],
    //         validate: {
    //             payload: Joi.object({
    //                 deptId: Joi.string().trim(),
    //                 deptName: Joi.string().trim().required(),
    //                 MGRNO: Joi.string().trim().required()
    //             }),
    //             failAction: UniversalFunctions.failActionFunction
    //         },
    //         plugins: {
    //             "hapi-sawgger": {
    //                 payloadType: "from",
    //                 response: Config.APP_CONSTANTS.swaggerDefaultResponseMessages
    //             }
    //         }
    //     }
    // },
    // //Fetch DepartMent
    // {
    //     method: "GET",
    //     path: "/admin/department",
    //     config: {
    //         handler: async function (request, h) {
    //             try {
    //                 return await UniversalFunctions.sendSuccess(
    //                     null,
    //                     await Controller.fetchDepartment(request.query)
    //                 )
    //             } catch (e) {
    //                 console.log(e);
    //                 return await UniversalFunctions.sendError(e)
    //             }
    //         },
    //         description: "Fetch Department API",
    //         auth: "AdminAuth",
    //         tags: ['api'],
    //         validate: {
    //             query: Joi.object({
    //                 skip: Joi.number(),
    //                 limit: Joi.number(),
    //                 search: Joi.string()
    //             }),
    //             failAction: UniversalFunctions.failActionFunction
    //         },
    //         plugins: {
    //             "hapi-sawgger": {
    //                 payloadType: "from",
    //                 response: Config.APP_CONSTANTS.swaggerDefaultResponseMessages
    //             }
    //         }
    //     }
    // },
    //Add Edit Employee
    {
        method: "POST",
        path: "/admin/addEmployee",
        config: {
            handler: async function (request, h) {
                try {
                    const userData =
                        request.auth &&
                        request.auth.credentials &&
                        request.auth.credentials.userData
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.addEditEmployee(request.payload, userData)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e)
                }
            },
            description: "Add Edit Employee",
            auth: "AdminAuth",
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    employeeId: Joi.string().trim(),
                    firstName: Joi.string().trim().required(),
                    lastName: Joi.string().trim().required(),
                    email: Joi.string().lowercase().trim().required(),
                    password: Joi.string().trim().required(),
                    mobile: Joi.string().trim().required(),
                    DOB: Joi.string().trim().required(),
                    departmentId: Joi.string().trim().required(),
                    salary: Joi.string().trim().required()
                }),
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-sawgger": {
                    payloadType: "from",
                    response: Config.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    //Fetch Employee List
    {
        method: "GET",
        path: "/admin/employeeList",
        config: {
            handler: async function (request, h) {
                try {
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.employeeList(request.query)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e)
                }
            },
            description: "Employee List API",
            auth: "AdminAuth",
            tags: ['api'],
            validate: {
                query: Joi.object({
                    skip: Joi.number(),
                    limit: Joi.number(),
                    search: Joi.string()
                }),
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-sawgger": {
                    payloadType: "from",
                    response: Config.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    //Employee Block Status
    {
        method: "POST",
        path: "/admin/employee/{employeeId}",
        config: {
            handler: async function (request, h) {
                try {
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.employeeStatusChange(request.params)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e)
                }
            },
            description: "Employee Status Change API",
            auth: "AdminAuth",
            tags: ['api'],
            validate: {
                params: Joi.object({
                    employeeId: Joi.string().trim().required()
                })
            },
            plugins: {
                "hapi-sawgger": {
                    payloadType: "from",
                    response: Config.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    //Delete Employee
    {
        method: "DELETE",
        path: "/admin/employee/{employeeId}",
        config: {
            handler: async function (request, h) {
                try {
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.employeeRemove(request.params)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e)
                }
            },
            description: "Delete Employee",
            auth: "AdminAuth",
            tags: ['api'],
            validate: {
                params: Joi.object({
                    employeeId: Joi.string().trim().required()
                })
            },
            plugins: {
                "hapi-sawgger": {
                    payloadType: "from",
                    response: Config.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    //Fetch Employee Apply leave List
    {
        method: "GET",
        path: "/admin/applyLeaveList",
        config: {
            handler: async function (request, h) {
                try {
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.applyLeaveList(request.query)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e)
                }
            },
            description: "Total Apply Leave List",
            tags: ['api'],
            validate: {
                query: Joi.object({
                    skip: Joi.number(),
                    limit: Joi.number(),
                    search: Joi.string()
                }),
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-sawgger": {
                    payloadType: "from",
                    responses: Config.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    //Respond Leave Application 
    {
        method: "POST",
        path: "/admin/respondApplication",
        config: {
            handler: async function (request, h) {
                try {
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.respondApplication(request.payload)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e)
                }
            },
            description: "Respond Leave Application API",
            auth: "AdminAuth",
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    leaveId: Joi.string().trim().required(),
                    response: Joi.string().trim().required()
                }),
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-sawgger": {
                    payloadType: "from",
                    responses: Config.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    //Set Employee Salary
    {
        method: "POST",
        path: "/admin/employeeSalary",
        config: {
            handler: async function (request, h) {
                try {
                    const userData =
                        request.auth &&
                        request.auth.credentials &&
                        request.auth.credentials.userData
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.monthWiseSalleryAgg(request.query, userData)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e);
                }
            },
            description: "Set Employee Salary Base On Leave API",
            auth: "AdminAuth",
            tags: ['api'],
            validate: {
                query: Joi.object({
                    employeeId: Joi.string().trim().required(),
                    year: Joi.string().trim().required(),
                    month: Joi.string().trim().required(),
                    // skip: Joi.number(),
                    // limit: Joi.number(),
                    // search: Joi.string()
                }),
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-sawgger": {
                    payloadType: "from",
                    responses: Config.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    //Set Employee Salary Notification
    {
        method: "POST",
        path: "/admin/salaryNotification",
        config: {
            handler: async function (request, h) {
                try {
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.monthWiseSalleryAggNotify()
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e);
                }
            },
            description: "Set Employee Salary Base On Leave API",
            // auth: "AdminAuth",
            tags: ['api'],
            validate: {
                // query: Joi.object({
                //     employeeId: Joi.string().trim().required(),
                //     year: Joi.string().trim().required(),
                //     month: Joi.string().trim().required(),
                //     skip: Joi.number(),
                //     limit: Joi.number(),
                //     search: Joi.string()
                // }),
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-sawgger": {
                    payloadType: "from",
                    responses: Config.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    //Today Employee  Birthday List
    {
        method: "POST",
        path: "/admin/todayBirthday",
        config: {
            handler: async function (request, h) {
                try {
                    return await UniversalFunctions, sendSuccess(
                        null,
                        await Controller.todayBirthDayList(request.payload)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e);
                }
            },
            description: "Todays Birthday Employee List API",
            auth: "AdminAuth",
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    DOB: Joi.string().required(),
                }),
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-sawgger": {
                    payloadType: "from",
                    responses: Config.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    //Today How Many Employee On Leave 
    {
        method: "POST",
        path: "/admin/employeeOnLeave",
        config: {
            handler: async function (request, h) {
                try {
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.empOnLeave(request.payload)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e);
                }
            },
            description: "Today How Many Employee On Leave",
            auth: "AdminAuth",
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    todayDate: Joi.string().trim().required(),
                    skip: Joi.number(),
                    limit: Joi.number(),
                    search: Joi.string()
                }),
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-sawgger": {
                    payloadType: "from",
                    responses: Config.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    //Add Edit Project
    {
        method: "POST",
        path: "/admin/addEditProject",
        config: {
            handler: async function (request, h) {
                try {
                    const userData =
                        request.auth &&
                        request.auth.credentials &&
                        request.auth.credentials.userData
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.addEditProject(request.payload, userData)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e);
                }
            },
            description: "Add Edit Project API",
            auth: "AdminAuth",
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    projectId: Joi.string().trim(),
                    title: Joi.string().trim().required(),
                    description: Joi.string().trim().required(),
                    employeeId: Joi.array(),
                    startDate: Joi.date().required(),
                    endDate: Joi.date().required()
                }),
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-sawgger": {
                    payloadType: "from",
                    responses: Config.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    //Fetch Project List
    {
        method: "GET",
        path: "/admin/projectList",
        config: {
            handler: async function (request, h) {
                try {
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.projectList(request.query)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e)
                }
            },
            description: " Fetch Project List API",
            auth: "AdminAuth",
            tags: ['api'],
            validate: {
                query: Joi.object({
                    skip: Joi.number(),
                    limit: Joi.number(),
                    search: Joi.number()
                }),
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-sawgger": {
                    payloadType: "from",
                    responses: Config.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    //Cron
    {
        method: "POST",
        path: "/admin/cron",
        config: {
            handler: async function (request, h) {
                try {
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.removeData()
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e)
                }
            },
            description: "Cron API",
            // auth: "AdminAuth",
            tags: ['api'],
            validate: {
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-sawgger": {
                    payloadType: "from",
                    responses: Config.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    //Send Email Nodemailer 
    {
        method: "POST",
        path: "/admin/email",
        config: {
            handler: async function (request, h) {
                try {
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.emailDemo()
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e)
                }
            },
            description: "Email Send API",
            auth: "AdminAuth",
            tags: ['api'],
            validate: {
                // payload: Joi.object({
                //     taskId: Joi.string().trim().required(),
                //     status: Joi.string().trim().required()
                // }),
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-sawgger": {
                    payloadType: "from",
                    responses: Config.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    //web-push 
    {
        method: "POST",
        path: "/admin/webPush",
        config: {
            handler: async function (request, h) {
                try {
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.webPushDemo(request.payload)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e)
                }
            },
            description: "Email Send API",
            auth: "AdminAuth",
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    demo: Joi.string().trim().required(),
                    endpoint: Joi.string().trim().required()
                }),
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "hapi-sawgger": {
                    payloadType: "from",
                    responses: Config.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
]