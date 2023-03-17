"use strict"

const Service = require("../Services").queries;
const UniversalFunctions = require("../Utils/UniversalFunction");
const Config = require("../Config");
const Model = require("../Models");
// const { resolve, parse } = require("path");
const { model } = require("mongoose");
// const { aggregate } = require("../Models/User");
const fs = require("fs");
const { json } = require("body-parser");
const csv = require("csvtojson");


//Demo
async function Demo(payloadData) {
    try {

        const data = await Service.saveData(Model.Ex, payloadData);
        if (!data) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
        };
        return data
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//Get Data
async function getData(queryData) {
    try {
        const data = await Service.getData(Model.Ex);
        function rev(data) {
            const map = {};
            const roots = [];
            let i, node;

            for (i = 0; i < data.length; i++) {
                map[data[i].id] = i;
                console.log("data[i]:", data[i]);
                console.log("map:", map);
                data[i].child = [];
            }

            for (i = 0; i < data.length; i++) {
                node = data[i];
                if (node.parentId !== "null") {
                    data[map[node.parentId]].child.push(node);
                    // let temp = map[node.parentId]
                    // let dataSpecifc = data[temp]
                    // dataSpecifc.child.push(node);
                    // data[temp] = dataSpecifc
                    /*
                    data -> []
                    1 = map[node.parentId]
                     map[node.parentId]

                    data[1].child 

                    [
                        {

                        },{
                            name: "",
                            "link": "",
                            child: [
                                {
                            name: "",
                            "link": "",
                            child: []
                        }
                            ]
                        }
                    ]


                    */
                } else {
                    roots.push(node);

                }
            }
            return roots;
        }
        const list = rev(data);
        // console.log("List:" + list);
        return list;

        // let Obj = {};
        // let temp = [];
        // data.map((item) => {
        //     let pid = item.parentId;
        //     let id = item.id;
        //     let childData = item.child;
        //     // console.log("parentId:" + pid);

        //     if (pid === "null") {

        //         temp.push(item)
        //         console.log("id:" + id);
        //         console.log("pid:" + pid);
        //         data.map((item) => {
        //             let partId = item.parentId;
        //             console.log("partId:" + partId);
        //             if (id === partId) {
        //                 childData.push(item);
        //                 // temp.push(item);

        //             }
        //         })

        //         // tempObj.data = obj
        //     }
        // })

        // console.log("temp: " + temp);

        // return temp;
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}
//Get Promisse Function
async function getDataDemo() {
    try {
        console.log("Promise Function");
        //Get Data
        const getData = async function (model, query) {
            return new Promise((resolve, reject) => {
                model.find(query, (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                })
            })
        }

        //FindOne Data And Update with Populate
        const findAndUpdateWithPopulate = function (model, query, update, collectionOptions, option) {
            return new Promise((resolve, reject) => {
                model.findOneAndUpdate(query, update).populate(collectionOptions).exce(function (err, data) {
                    if (err) reject(err);
                    else resolve(data);
                })
            })
        }

        //find with Populate
        const populateData = function (model, query, collectionOptions) {
            return new Promise((resolve, reject) => {
                model.find(query, (err, data) => {
                    if (err) reject(err)
                    else resolve(data)
                })
                // .exce(function (err, data) {
                //     if (err) reject(err)
                //     else resolve(data);
                // })
            })
        }

        //Count 
        const count = function (model, query) {
            return new Promise((resolve, reject) => {
                model.find(query, (err, data) => {
                    if (err) reject(err)
                    else resolve(data.length)
                })
            })
        }

        const dataList = populateData(Model.Ex, { parentId: "null" }, {});
        const totalCount = count(Model.Ex, { parentId: "null" });
        const getDataList = getData(Model.Ex);
        // return {
        //     data: dataList,
        //     totalCount: totalCount
        // };
        return totalCount;
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
    }
}

//Aggregate Map And Filter Function
async function demoAggregate(queryData) {
    // try {
    //     const { skip = undefined, limit = undefined, search, taskId } = queryData;
    //     const condition = { isDeleted: false }
    //     // if (taskId)
    //     //     condition._id = mongoose.Types.ObjectId(taskId)

    //     const aggregate = [
    //         { $match: { ...condition } }
    //     ];

    //     if (typeof skip !== "undefined" && typeof limit !== "undefined") {
    //         aggregate.push({ $skip: skip }, { $limit: limit }, { $sort: sorting })
    //     }

    //     const Collection_A = {
    //         _id: 1,
    //         name: "A",
    //         includes: [
    //             {
    //                 _id: 1,
    //                 includes_id: 222,
    //             },
    //             {
    //                 _id: 2,
    //                 includes_id: 333
    //             }
    //         ]
    //     }

    //     const Collection_B = {
    //         _id: 222,
    //         type: "Computer",
    //         name: "Computer",
    //         ref_id: 1
    //     }

    //     const Collection_C = {
    //         _id: 333,
    //         type: "Human",
    //         name: "Human",
    //         ref_id: 1
    //     }

    //     const Collection_D = {
    //         _id: 444,
    //         type: "Animal",
    //         name: "Animal",
    //         ref_id: 1
    //     }

    //     const data = Model.Task.aggregate(aggregate);
    //     console.log("Data:", data);
    // } 
    try {
        const data = await Model.Task.aggregate([
            // {
            //     $match: { _id: userData._id }
            // },
            {
                $lookup: {
                    from: "projects",
                    localField: "projectId",
                    foreignField: "_id",
                    as: "Project_Info"
                },
            },
            {
                $unwind: "$Project_Info"
            },
            {
                $lookup: {
                    from: "employees",
                    localField: "employeeId",
                    foreignField: "_id",
                    as: "employee_Info"
                },
            },
            {
                $unwind: "$employee_Info"
            },
            {
                $project: {
                    task: 1,
                    project: 1,
                    status: 1,
                    projectInfo: "$Project_Info",
                    employeeInfo: "$employee_Info",
                    projectList: {
                        $map: {
                            input: "$employeeId",
                            as: "i",
                            in: {
                                // $add: ["$$i", 1000],
                                $arrayElemAt: [
                                    {
                                        $filter: {
                                            input: "$employee_Info",
                                            cond: {
                                                $eq: ["$$this._id", "$$i"]
                                            }
                                        }
                                    },
                                    0
                                ]
                            }

                        }
                    }
                }
            },
            // {
            //     $group: {
            //         _id: null,
            //         firstName: { $first: "$firstName" },
            //         lastName: { $first: "$lastName" },
            //         email: { $first: "$email" },
            //         taskInfo: { $addToSet: "$taskInfo" }
            //     }
            // }
        ]);
        return data
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
    }
}

// //import CSV
// async function importCSV(payloadData) {
//     try {

//         let csvToJson = require('convert-csv-to-json');
//         const result = [];

//         // let json = csvToJson.getJsonFromCsv(payloadData.file.path);
//         const json = csvToJson.getJsonFromCsv(payloadData.file.path);
//         for (let i = 0; i < json.length; i++) {
//             console.log(json[i]);
//             result.push(json[i]);
//         }
//         console.log("result:", result);


//         // const file = require(payloadData.file.path);
//         // const result = [];
//         // console.log("file:", file);
//         // fs.readFileSync(file)
//         //     .pipe(csv({}))
//         //     .on("data", function (data) {
//         //         result.push(data);
//         //     })
//         //     // .on("error", function (error) {
//         //     //     console.log(error.message);
//         //     // })
//         //     .on("end", function () {
//         //         console.log(result)
//         //     });

//         // console.log("Import CSV File");

//         // const data = fs.readFile(payloadData.file.path)

//         //     .parse(data, (err, records) => {
//         //         if (err) {
//         //             console.error(err)
//         //             return res.status(400).json({ success: false, message: 'An error occurred' })
//         //         }

//         //         return res.json({ data: records })
//         //     })
//         // console.log("data:", data);

//         // const file2 = payloadData.file.path;
//         // console.log("file:", file2);

//         // const data = fs.readFileSync(file2);
//         // console.log("data:", data);
//         // json(data, (err, records) => {
//         //     if (err) {
//         //         return res.status(400).json({ success: false, message: 'An error occurred' })
//         //     } else {
//         //         return res.json({ data: records })
//         //     }
//         // })

//     } catch (err) {
//         console.log(err);
//         return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
//     }
// }

//import CSV
async function importCSV(payloadData) {
    try {

        // const file = require("../Controllers/localdatas.csv");
        // const result = [];
        // fs.createReadStream(file)
        //     .pipe(csv({}))
        //     .on("data", function (data) {
        //         result.push(data);
        //     })
        //     // .on("error", function (error) {
        //     //     console.log(error.message);
        //     // })
        //     .on("end", function () {
        //         console.log(result)
        //     });

        let result = [];
        csv()
            .fromFile(payloadData.file.path)
            .then(async (response) => {
                console.log("Response:", response);
                response.map((item) => {
                    result.push({
                        deptName: item.deptName
                    });
                })
                console.log("result:", result);
                const dept = await Service.saveData(Model.Department, result);
                console.log("dept:", dept);
            })
            .catch((err) => {
                console.log(err);
            })
        console.log("result:", result);
        return ({ status: 200, meassgae: "Import File" })

    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

module.exports = {
    Demo,
    getData,
    demoAggregate,
    getDataDemo,
    importCSV,
}