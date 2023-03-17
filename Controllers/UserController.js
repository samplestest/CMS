"use strict"

const Service = require("../Services").queries;
const UniversalFunctions = require("../Utils/UniversalFunction");
const Config = require("../Config");
const Model = require("../Models");
const { payload } = require("@hapi/hapi/lib/validation");
const TokenManager = require("../Lib/TokenManager");
const CodeGenerator = require("../Lib/CodeGenerator");
const emailFunction = require("../Lib/email");
const { limit } = require("@hapi/joi/lib/common");

//File Upload
async function fileUpload(payloadData) {
    try {
        let file = await UniversalFunctions.uploadImage(payloadData.file);
        return file
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//Delete S3 File 
async function deleteS3File(queryData) {
    try {
        let file = await UniversalFunctions.deleteS3File(queryData.fileUrl);
        if (file) {
            return Config.APP_CONSTANTS.STATUS_MSG.SUCCESS.DELETED
        }
        else {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
        }
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//User Register
async function createUser(payloadData) {
    try {
        if (await Service.findOne(Model.User, { email: payloadData.email })) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
        }
        if (await Service.findOne(Model.User, { mobile: payloadData.mobile })) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
        }

        const password = await UniversalFunctions.CryptData(payloadData.password);
        payloadData.password = password;

        const user = await Service.saveData(Model.User, payloadData)
        if (!user) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
        }
        // user = JSON.parse(JSON.stringify(user));
        delete user.password
        return user
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//User Login
async function userLogin(payloadData) {
    try {
        let user = await Service.findOne(Model.User, { email: payloadData.email })
        if (!user) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.USER_NOT_EXISTS);
        }
        let validate = await UniversalFunctions.comparePassword(payloadData.password.toString(), user.password);
        if (!validate) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_PASSWORD);
        }
        let tokenData = await TokenManager.setToken(
            {
                _id: user._id,
                type: Config.APP_CONSTANTS.DATABASE.USER_TYPE.USER
            }
        )
        user.accessToken = tokenData.accessToken
        // user = JSON.parse(JSON.stringify(user));
        delete user.password
        return user
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//User Forgot Password
async function forgotPassword(payloadData) {
    try {
        let criteria = false
        if (payloadData.email) {
            criteria = { email: payloadData.email }
        }
        let user = await Service.findOne(Model.User, criteria, {}, { lean: true })
        if (!user) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_PHONE_EMAIL);
        }
        const verificationCode = await CodeGenerator.generateCode(6, 'numeric');
        let otpData = {
            code: verificationCode,
            type: Config.APP_CONSTANTS.DATABASE.OTP_TYPE.FORGOT_PASSWORD
        };
        console.log("otpData: " + otpData);
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
            statusCode: 200,
            customMassage: "Otp Send On Email",
            type: "OTP_SEND_ON_Email"
        }

    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

// User OTP Verify
async function verifyOTP(payloadData) {
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

//User Change Password
async function changePassword(payloadData) {
    try {
        const {
            STATUS_MSG: {
                SUCCESS: { UPDATED },
                ERROR: { IMP_ERROR, INVALID_OTP },
            },
            DATABASE: {
                USER_TYPE: { USER },
                OTP_TYPE: { FORGOT_PASSWORD },
            },
        } = Config.APP_CONSTANTS;
        const { email, code, password } = payloadData;
        let otpobj = await Service.findAndUpdate(Model.OtpCode,
            { email: email, code: code, status: 1, type: FORGOT_PASSWORD },
            { lean: true }
        );
        if (!otpobj) return Promise.reject(INVALID_OTP);
        const user = await Service.findAndUpdate(
            Model.User,
            { email: email },
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
                type: USER
            });
            return UPDATED
        }

    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//Fetch User
async function fetchUser(queryData, userData) {
    try {
        const { skip = undefined, limit = undefined, search, active = undefined } = queryData;
        let query = { isDeleted: false };
        let projection = { isDeleted: 0, accessToken: 0, password: 0 };
        let option = { sort: { _id: -1 } }
        if (typeof skip !== "undefined" && typeof limit !== "undefined")
            option = { skip: skip, limit: limit, sort: { _id: -1 } }
        if (search)
            query.name = new RegExp(search, "ig");
        if (typeof active !== "undefined")
            query.active = active;
        let data = await Service.getData(Model.User, query, projection, option);
        let total = await Service.count(Model.User, query);
        return {
            userData: data,
            total: total
        }

    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//User Status Change 
async function userStatuschange(paramsData) {
    try {
        let find = await Service.findOne(Model.User, { _id: paramsData.userId })
        if (!find)
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.NOT_EXIST)
        let isBlocked
        if (find.isBlocked)
            isBlocked = false
        else
            isBlocked = true
        let data = await Service.findAndUpdate(Model.User, { _id: paramsData.userId }, { isBlocked: isBlocked }, { lean: true, new: true })
        if (!data)
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
        if (isBlocked)
            return Config.APP_CONSTANTS.STATUS_MSG.SUCCESS.INACTIVE
        else
            return Config.APP_CONSTANTS.STATUS_MSG.SUCCESS.ACTIVE
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//user profile Update
async function userProfileUpdate(payloadData, userData) {
    try {
        if (await Service.findOne(Model.User, { email: payloadData.email, _id: { $ne: userData._id } })) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.EMAIL_ALREADY_EXIST);
        }
        if (await Service.findOne(Model.User, { mobile: payloadData.mobile, _id: { $ne: userData._id } })) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.PHONE_ALREADY_EXIST);
        }

        payloadData.password = await UniversalFunctions.CryptData(payloadData.password);
        const update = await Service.findAndUpdate(Model.User, { _id: userData._id }, payloadData)
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

//Guest User
async function guestUser(payloadData) {
    try {
        let data = await Service.findAndUpdate(
            Model.GuestUser,
            { ipAddress: payloadData.ipAddress },
            { $set: { ...payloadData } },
            { upsert: true }
        );
        if (!data) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
        }
        return data
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//User Address Update
async function userAddressUpdate(payloadData, userData) {
    try {
        let user
        if (payloadData.addressId) {
            user = await Service.findAndUpdate(Model.User, { _id: userData._id, 'address._id': payloadData.addressId },
                { "address.$": payloadData }, { new: true })
        } else {
            user = await Service.findAndUpdate(Model.User, { _id: userData._id }, { $push: { address: payloadData } }, { new: true })
            if (!user) {
                return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
            }
        }
        user = JSON.parse(JSON.stringify(user));
        delete user.password
        delete user.accessToken
        return user
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
    }
}

//User Get Address 
async function getUserAddress(userData) {
    try {
        return await Service.findOne(Model.User, { _id: userData._id }, { address: 1 }, { new: true })
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
    }
}

//Delete User Addresss
async function deleteUserAddress(paramsData, userData) {
    try {
        let data = await Service.findAndUpdate(Model.User,
            { _id: userData._id },
            { $pull: { address: { _id: paramsData.addressId } } }, { new: true });
        if (!data) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
        }
        data = JSON.parse(JSON.stringify(data));
        delete data.password;
        delete data.accessToken;
        return data
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

module.exports = {
    fileUpload,
    deleteS3File,
    createUser,
    userLogin,
    forgotPassword,
    verifyOTP,
    changePassword,
    fetchUser,
    userStatuschange,
    userProfileUpdate,
    guestUser,
    userAddressUpdate,
    getUserAddress,
    deleteUserAddress
}