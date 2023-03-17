"use strict"

const { UserController: Controller } = require("../Controllers");
const UniversalFunctions = require("../Utils/UniversalFunction");
const Joi = require('joi');
const Config = require("../Config");
const { cloudsearch } = require("googleapis/build/src/apis/cloudsearch");

module.exports = [
    //File Upload
    {
        method: "POST",
        path: "/file-upload",
        config: {
            handler: async function (request, h) {
                try {
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.fileUpload(request.payload)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e)
                }
            },
            description: "File Upload",
            tags: ["api", "admin"],
            payload: {
                maxBytes: 1000000,
                parse: true,
                multipart: {
                    output: "file"
                }
            },
            validate: {
                payload: Joi.object({
                    file: Joi.any()
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
    //Delete s3 File
    {
        method: "DELETE",
        path: "/delete-file",
        config: {
            handler: async function (request, h) {
                try {
                    return UniversalFunctions.sendSuccess(
                        null,
                        await Controller.deleteS3File(request.query)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e)
                }
            },
            description: "Delete S3 file",
            tags: ['api', "admin"],
            validate: {
                query: Joi.object({
                    fileUrl: Joi.string().required()
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
    //User Register
    {
        method: "POST",
        path: "/user/register",
        config: {
            handler: async function (request, h) {
                try {
                    return UniversalFunctions.sendSuccess(
                        null,
                        await Controller.createUser(request.payload)
                    )
                } catch (err) {
                    console.log(err);
                    return await UniversalFunctions.sendError(err);
                }
            },
            description: "User Register APi",
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    firstName: Joi.string().trim().required(),
                    lastName: Joi.string().trim().required(),
                    email: Joi.string().lowercase().trim().required(),
                    password: Joi.string().trim().required(),
                    mobile: Joi.string().trim().required(),
                    image: Joi.string().trim().required()
                }),
                failAction: UniversalFunctions.failActionFunction,
            },
            plugins: {
                "hapi-sawgger": {
                    payloadType: "from",
                    responses: Config.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    //User Login
    {
        method: "POST",
        path: "/user/login",
        config: {
            handler: async function (request, h) {
                try {
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.userLogin(request.payload)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e)
                }
            },
            description: "User Login",
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
    //User Forgot Password
    {
        method: "POST",
        path: "/user/forgot-password",
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
            description: "User Forgot Password API",
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
    //Validate-Otp
    {
        method: "POST",
        path: "/user/verify-otp",
        config: {
            handler: async function (request, h) {
                try {
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.verifyOTP(request.payload)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e);
                }
            },
            description: "User Verify API",
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    email: Joi.string().lowercase().trim().required(),
                    code: Joi.string().trim().required()
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
    //Change Password
    {
        method: "POST",
        path: "/user/Change-password",
        config: {
            handler: async function (request, h) {
                try {
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.changePassword(request.payload)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e)
                }
            },
            description: "User Change Password API",
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
    //Fetch User 
    {
        method: "GET",
        path: "/admin/user",
        config: {
            handler: async function (request, h) {
                try {
                    const userData =
                        request.auth &&
                        request.auth.credentials &&
                        request.auth.credentials.userData
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.fetchUser(request.query, userData)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e)
                }
            },
            description: "Fetch User API",
            tags: ['api'],
            validate: {
                query: Joi.object({
                    skip: Joi.number(),
                    limit: Joi.number(),
                    active: Joi.boolean(),
                    search: Joi.string()
                }),
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                "happi-sawgger": {
                    payloadType: "from",
                    responses: Config.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    //User Status Change
    {
        method: "POST",
        path: "/admin/user/{userId}",
        config: {
            handler: async function (request, h) {
                try {
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.userStatuschange(request.params)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e)
                }
            },
            description: "User Status Change API",
            tags: ['api'],
            validate: {
                params: Joi.object({
                    userId: Joi.string().trim().required()
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
    //User Profile Update
    {
        method: "POST",
        path: "/user/profile",
        config: {
            handler: async function (request, h) {
                try {
                    const userData =
                        request.auth &&
                        request.auth.credentials &&
                        request.auth.credentials.userData
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.userProfileUpdate(request.payload, userData)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e)
                }
            },
            description: "User Profile Update API",
            auth: "UserAuth",
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    firstName: Joi.string().trim().required(),
                    lastName: Joi.string().trim().required(),
                    email: Joi.string().lowercase().trim().required(),
                    password: Joi.string().trim().required(),
                    mobile: Joi.string().trim().required(),
                    images: Joi.string().trim().required()
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
    //Guest User
    {
        method: "POST",
        path: "/guest_user",
        config: {
            handler: async function (request, h) {
                try {
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.guestUser(request.payload)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e);
                }
            },
            description: "Guest User API",
            tags: ['api', 'guest User'],
            validate: {
                payload: Joi.object({
                    ipAddress: Joi.string().trim().required(),
                    country: Joi.string().trim().required(),
                    state: Joi.string().trim().required(),
                    city: Joi.string().trim().required()
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
    //User Address Update
    {
        method: "POST",
        path: "/user/address",
        config: {
            handler: async function (request, h) {
                try {
                    const userData =
                        request.auth &&
                        request.auth.credentials &&
                        request.auth.credentials.userData
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.userAddressUpdate(request.payload, userData)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e)
                }
            },
            description: "User Address Update API",
            auth: "UserAuth",
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    addressId: Joi.string(),
                    name: Joi.string().trim().required(),
                    mobile: Joi.string().trim().required(),
                    address: Joi.string().trim().required(),
                    location: Joi.string().trim().required(),
                    pincode: Joi.string().trim().required(),
                    city: Joi.string().trim().required(),
                    state: Joi.string().trim().required(),
                    type: Joi.string().valid('Home', 'Office').required(),
                    default: Joi.boolean()
                })
            }
        }
    },
    //User Get Address
    {
        method: "GET",
        path: "/user/address",
        config: {
            handler: async function (request, h) {
                try {
                    let userData =
                        request.auth &&
                        request.auth.credentials &&
                        request.auth.credentials.userData
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.getUserAddress(userData)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e)
                }
            },
            description: "User Get Address API",
            auth: "UserAuth",
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
    //Delete Address
    {
        method: "DELETE",
        path: "/user/address/{addressId}",
        config: {
            handler: async function (request, h) {
                try {
                    const userData =
                        request.auth &&
                        request.auth.credentials &&
                        request.auth.credentials.userData
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.deleteUserAddress(request.params, userData)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e);
                }
            },
            description: "Delete User Address API",
            auth: "UserAuth",
            tags: ['api', 'address'],
            validate: {
                params: Joi.object({
                    addressId: Joi.string().trim().required()
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
    }
]