"use strict"

const { ExController: Controller } = require("../Controllers");
const UniversalFunctions = require("../Utils/UniversalFunction");
const Joi = require("joi");
const Config = require("../Config");


module.exports = [
    //Demo
    {
        method: "POST",
        path: "/demo",
        config: {
            handler: async function (request, h) {
                try {
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.Demo(request.payload)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e)
                }
            },
            description: "Demo API",
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    id: Joi.string().trim().required(),
                    name: Joi.string().trim().required(),
                    parentId: Joi.string().trim()
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
    //get data 
    {
        method: "GET",
        path: "/demo",
        config: {
            handler: async function (request, h) {
                try {
                    return UniversalFunctions.sendSuccess(
                        null,
                        await Controller.getDataDemo(request.query)
                    )
                } catch (e) {
                    console.log(e);
                    return UniversalFunctions.sendError(e)
                }
            },
            description: "Get Data API",
            tags: ['api'],
            validate: {
                query: Joi.object({
                    skip: Joi.number(),
                    limit: Joi.number()
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
    //get Aggregate Map and Filter Data 
    {
        method: "GET",
        path: "/demoAgg",
        config: {
            handler: async function (request, h) {
                try {
                    return UniversalFunctions.sendSuccess(
                        null,
                        await Controller.demoAggregate(request.query)
                    )
                } catch (e) {
                    console.log(e);
                    return UniversalFunctions.sendError(e)
                }
            },
            description: "Get Data Aggregate API",
            tags: ['api'],
            validate: {
                query: Joi.object({
                    skip: Joi.number(),
                    limit: Joi.number()
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
    //Import CSV
    {
        method: "POST",
        path: "/admin/import/csv",
        config: {
            handler: async function (request, h) {
                try {
                    return await UniversalFunctions.sendSuccess(
                        null,
                        await Controller.importCSV(request.payload)
                    )
                } catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e);
                }
            },
            description: "CSV Import API",
            // auth: "AdminAuth",
            tags: ['api'],
            payload: {
                maxBytes: 100000000,
                parse: true,
                multipart: {
                    output: "file"
                },
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
]