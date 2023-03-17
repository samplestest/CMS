"use strict"

const Service = require("../Services").queries;
const UniversalFunctions = require("../Utils/UniversalFunction");
const Config = require("../Config");
const Model = require("../Models");
const CodeGenerator = require("../Lib/CodeGenerator");

//Add Edit Department
async function addEditDepartment(payloadData, userData) {
    try {
        if (payloadData.deptId) {
            let data = await Service.findAndUpdate(Model.Department,
                { _id: payloadData.deptId },
                payloadData
            );

            if (data !== null) return Config.APP_CONSTANTS.STATUS_MSG.SUCCESS.UPDATED
            else Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
        } else {
            if (await Service.findOne(Model.Department, { deptName: payloadData.deptName }, { lean: true, new: true })) {
                return Config.APP_CONSTANTS.STATUS_MSG.ERROR.DEPARTMENT_ALREADY_EXIT
            }
            payloadData.addedBy = userData._id;
            let code = await CodeGenerator.generateCode(4, "numeric");
            payloadData.deptNo = code;
            let dept = await Service.saveData(Model.Department, payloadData);
            if (!dept)
                return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
            return dept;
        }
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
    }
}

//Fetch department 
async function fetchDepartment(payloadData) {
    try {
        const { skip = undefined, limit = undefined, search } = payloadData;
        const query = { isDelete: false };
        const projection = { isDelete: 0 };
        const options = { sort: { _id: -1 } }
        if (typeof skip !== "undefined" && typeof limit !== "undefined")
            options = { skip: skip, limit: limit, sort: { _id: -1 } };
        if (search)
            query.fullName = new RegExp(search, "ig");
        const data = await Service.getData(Model.Department, query, projection, options);
        const total = await Service.count(Model.Department, query);

        return {
            DepartmentData: data,
            Total: total
        }
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

// //Backup Code in sloat start and endTime
// exports.demo = async (req, res) => {
//     try {
//         const body = req.body;
//         console.log("body:", body);
//         const data = body.sloat;
//         console.log("data:", data);
//         data.map((item, index) => {
//             let obj = item;
//             // console.log("dfkhdfksjhdk", obj)
//             // let startTime = item.startTime;
//             // let endtime = item.endTime;
//             // let interval = 30; // in minutes
//             // let end_time = parseTime(endtime)
//             // let start_time = parseTime(startTime)

//             // let times_ara = calculate_time_slot(start_time, end_time, interval);
//             // console.log("sdgugjas", times_ara)
//             // console.log("item:", item);
//             const st = moment(item.startTime, "hh:mm");
//             const et = moment(item.endTime, "hh:mm");
//             let allSloat = [];
//             obj.sloats = [];

//             while (st < et) {
//                 console.log("st:bfdgfgd", st);
//                 // obj.sloats.push(st);
//                 allSloat.push(st.format("hh:mm"));
//                 // console.log("ppppppppppppppp:", obj.sloats);
//                 console.log("sloat:", allSloat);
//                 st.add(30, 'minutes');
//             }
//             // console.log("dsfhjgdsg", obj.sloats)
//             console.log("allSloat:", allSloat);
//         })

//         // if (body.date && body.startTime) {
//         //     let existingData = await Sloat.find({
//         //         date: body.date
//         //     })
//         //     if (existingData.length > 0) {
//         //         // res.send({ message: "Sloat Already Created", status: 500 });
//         //         const update = await Sloat.findOneAndUpdate(
//         //             { date: body.date },
//         //             { $set: { startTime: body.startTime } },
//         //             { new: true }
//         //         );
//         //         // console.log("update:", update);
//         //         res.status(200).send({ message: 'Sloat Update Succesfully' })
//         //     } else {
//         //         const data = new Sloat({
//         //             date: body.date,
//         //             startTime: body.startTime,
//         //         });
//         //         const saveStatus = await data.save();
//         //         if (saveStatus) {
//         //             res.send(saveStatus);
//         //         }
//         //     }
//         // } else {
//         //     res.status(500).send({ message: 'Invalid Payload' });
//         // }
//     } catch (error) {
//         console.log(error);
//         res.send(error);
//     }
// }

module.exports = {
    addEditDepartment,
    fetchDepartment
}