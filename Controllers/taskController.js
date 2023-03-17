"use strict"

const Service = require("../Services").queries;
const UniversalFunctions = require("../Utils/UniversalFunction");
const Config = require("../Config");
const Model = require("../Models");
const { default: mongoose } = require("mongoose");
const { emit } = require("../Models/User");

//Add Edit Task
async function addEditTask(payloadData, userData) {
    try {
        payloadData.addedBy = userData._id
        let task
        if (payloadData.taskId) {
            task = await Service.findAndUpdate(Model.Task, { _id: payloadData.taskId }, payloadData, { new: true, lean: true })
        } else {
            const condition = { _id: payloadData.projectId, employeeId: payloadData.employeeId }
            const find = await Service.findOne(Model.Project, condition);
            console.log("find:", find);
            if (find) {
                task = await Service.saveData(Model.Task, payloadData)
            } else {
                return Config.APP_CONSTANTS.STATUS_MSG.ERROR.NOT_EXIST;
            }
        }
        if (!task) {
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
        }
        return task
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//View All Task
async function viewTask(queryData) {
    try {
        const { skip = undefined, limit = undefined, search } = queryData;
        const condition = { isDeleted: false }

        const aggregate = [
            { $match: { ...condition } }
        ];

        if (typeof skip !== "undefined" && typeof limit !== "undefined") {
            aggregate.push({ $skip: skip }, { $limit: limit }, { $sort: sorting })
        }

        aggregate.push(
            {
                $lookup: {
                    from: "projects",
                    let: { "project": "$projectId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$_id", "$$project"] }
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                title: 1,
                                description: 1,
                                employeeId: 1,
                                startDate: 1,
                                endDate: 1
                            }
                        }
                    ],
                    as: "ProjectData"
                }
            },
            {
                $unwind: { path: "$ProjectData", preserveNullAndEmptyArrays: true }
            },
            {
                $unwind: { path: "$employeeId", preserveNullAndEmptyArrays: true }
            },
            {
                $lookup: {
                    from: "employees",
                    let: { "employee": "$employeeId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$_id', "$$employee"] }
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                firstName: 1
                            }
                        }
                    ],
                    as: "EmployeeData"
                }
            },
            {
                $unwind: { path: "$EmployeeData", preserveNullAndEmptyArrays: true }
            },
            // {
            //     $lookup: {
            //         from: "tasktimers",
            //         let: { "taskId": "$_id" },
            //         pipeline: [
            //             {
            //                 $match: {
            //                     $expr: {
            //                         $and: [
            //                             { $eq: ['$taskId', "$$taskId"] }
            //                         ]
            //                     }
            //                 }
            //             },
            //             {
            //                 $project: {
            //                     startTime: 1
            //                 }
            //             }
            //         ],
            //         as: "TaskTimerData"
            //     }
            // },
            // {
            //     $unwind: { path: "$TaskTimerData", preserveNullAndEmptyArrays: true }
            // }
        )

        const data = await Model.Task.aggregate(aggregate);
        return data
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//Change Task Status
async function changeStatus(payloadData) {
    try {
        // const diff = moment(new Date()).diff(moment(find.startDate), 'days');
        // console.log("Diff:", diff);
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

//View Task Detail
async function viewTaskDetail(queryData) {
    try {
        const { skip = undefined, limit = undefined, search, taskId } = queryData;
        const condition = { isDeleted: false }
        if (taskId)
            condition._id = mongoose.Types.ObjectId(taskId)

        const aggregate = [
            { $match: { ...condition } }
        ];

        if (typeof skip !== "undefined" && typeof limit !== "undefined") {
            aggregate.push({ $skip: skip }, { $limit: limit }, { $sort: sorting })
        }

        aggregate.push(
            {
                $lookup: {
                    from: "projects",
                    let: { "project": "$projectId" },


                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$_id", "$$project"] }
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                title: 1,
                                description: 1,
                                // employeeId: 1,
                                startDate: 1,
                                endDate: 1
                            }
                        }
                    ],
                    as: "ProjectData"
                }
            },
            {
                $unwind: { path: "$ProjectData", preserveNullAndEmptyArrays: true }
            },
            {
                $unwind: { path: "$employeeId", preserveNullAndEmptyArrays: true }
            },
            {
                $lookup: {
                    from: "employees",
                    let: { "employee": "$employeeId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$_id', "$$employee"] }
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                firstName: 1
                            }
                        }
                    ],
                    as: "EmployeeData"
                }
            },
            {
                $unwind: { path: "$EmployeeData", preserveNullAndEmptyArrays: true }
            },
            {
                $lookup: {
                    from: "tasktimers",
                    let: { "taskId": "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$taskId', "$$taskId"] }
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                taskId: 1,
                                projectId: 1,
                                startTime: 1,
                                endTime: 1,
                                addedBy: 1
                            }
                        }
                    ],
                    as: "TaskTimerData"
                }
            },
            {
                $unwind: { path: "$TaskTimerData", preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    _id: 1,
                    task: 1,
                    projectId: 1,
                    employeeId: 1,
                    status: 1,
                    ProjectData: 1,
                    EmployeeData: 1,
                    TaskTimerData: 1,
                    timerTaskData: {
                        _id: "$TaskTimerData._id",
                        taskId: "$TaskTimerData.taskId",
                        projectId: "$TaskTimerData.projectId",
                        employeeId: "$TaskTimerData.addedBy",
                        startTime: "$TaskTimerData.startTime",
                        endTime: "$TaskTimerData.endTime",
                        Hour: {
                            $sum: { $divide: [{ $subtract: ['$TaskTimerData.endTime', '$TaskTimerData.startTime'] }, 3600000], }
                        },
                    },
                    diffHour: {
                        $divide: [{ $subtract: ['$TaskTimerData.endTime', '$TaskTimerData.startTime'] }, 3600000],
                    }
                }
            },
            {
                $group: {
                    _id: "$_id",
                    task: { "$first": "$task" },
                    projectId: { "$first": "$projectId" },
                    employeeId: { "$addToSet": "$employeeId" },
                    status: { "$first": "$status" },
                    ProjectData: { "$addToSet": "$ProjectData" },
                    EmployeeData: { "$addToSet": "$EmployeeData" },
                    TaskTimerData: { "$addToSet": "$TaskTimerData" },
                    timerTaskData: { "$addToSet": "$timerTaskData" },
                    WorkingHour: { "$addToSet": "$diffHour" },

                    TaskTimerData: { "$addToSet": "$timerTaskData" },

                    // empWorkingTime: {
                    //     $addToSet: {
                    //         employeeId: "$timer.employeeId",
                    //         taskId: "$timer.taskId",
                    //         // startTime: "$timer.startTime"
                    //         hour: { $sum: "$timer.Hour" },
                    //     }
                    // }
                    // WorkingHour: { $sum: "$diffHour" }

                }
            },
            {
                $addFields: {
                    TotalWorkingHour: { $sum: "$WorkingHour" },

                }
            }
        )
        // const condition2 = { isDeleted: false }
        // const aggregateTimer = (res) => {
        //     [
        //         { $match: { ...res.condition } },

        //     ];
        // }
        // aggregateTimer.push(
        //     {
        //         $lookup: {
        //             from: "tasks",
        //             let: { "taskId": "$taskId" },
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: {
        //                             $and: [
        //                                 { $eq: ['$_id', "$$taskId"] }
        //                             ]
        //                         }
        //                     }
        //                 },
        //                 {
        //                     $project: {
        //                         // taskId: 1,
        //                         projectId: 1,
        //                         // startTime: 1,
        //                         // endTime: 1,
        //                         addedBy: 1
        //                     }
        //                 }
        //             ],
        //             as: "TaskTimerData"
        //         }
        //     },
        //     {
        //         $unwind: { path: "$TaskTimerData", preserveNullAndEmptyArrays: true }
        //     },
        //     {
        //         $project: {
        //             task: 1,
        //             projectId: 1,
        //             employeeId: 1,
        //             status: 1,
        //             ProjectData: 1,
        //             EmployeeData: 1,
        //             TaskTimerData: 1,
        //             timer: {
        //                 taskId: "$TaskTimerData.taskId",
        //                 projectId: "$TaskTimerData.projectId",
        //                 employeeId: "$TaskTimerData.addedBy",
        //                 startTime: "$TaskTimerData.startTime",
        //                 endTime: "$TaskTimerData.endTime",
        //                 Hour: {
        //                     $sum: { $divide: [{ $subtract: ['$TaskTimerData.endTime', '$TaskTimerData.startTime'] }, 3600000], }
        //                 },
        //             },
        //             diffHour: {
        //                 $divide: [{ $subtract: ['$TaskTimerData.endTime', '$TaskTimerData.startTime'] }, 3600000],
        //             }
        //         }
        //     },
        //     {
        //         $group: {
        //             _id: null,
        //             task: { "$first": "$task" },
        //             projectId: { "$first": "$projectId" },
        //             employeeId: { "$addToSet": "$employeeId" },
        //             status: { "$first": "$status" },
        //             ProjectData: { "$addToSet": "$ProjectData" },
        //             EmployeeData: { "$addToSet": "$EmployeeData" },
        //             TaskTimerData: { "$addToSet": "$TaskTimerData" },
        //             WorkingHour: { "$addToSet": "$diffHour" },

        //             // timer: { "$addToSet": "$timer" },


        //             // workingTime: {
        //             //     $addToSet: {
        //             //         employeeId: "$timer.employeeId",
        //             //         taskId: "$timer.taskId",
        //             //         Hour: { "$sum": "$timer.Hour" }
        //             //     }
        //             // }

        //             // empWorkingTime: {
        //             //     $addToSet: {
        //             //         employeeId: "$timer.employeeId",
        //             //         taskId: "$timer.taskId",
        //             //         // startTime: "$timer.startTime"
        //             //         hour: { $sum: "$timer.Hour" },
        //             //     }
        //             // }
        //             // WorkingHour: { $sum: "$diffHour" }

        //         }
        //     },
        //     {
        //         $addFields: {
        //             TotalWorkingHour: { $sum: "$WorkingHour" },

        //         }
        //     }
        // )


        const data = await Model.Task.aggregate(aggregate);
        const tasktimer = await Service.getData(Model.TaskTimer);
        let temp = {};
        await data.map((item) => {
            const record = item;
            console.log("Record:", record);
            for (let index = 0; index < item.TaskTimerData.length; index++) {
                const element = item.TaskTimerData[index];
                let obj = {
                    timerId: element._id,
                    taskId: element.taskId,
                    employeeId: element.employeeId
                }
                console.log("obj:", obj);
                if (obj in temp) {
                    console.log("Recorded")
                }
            }
        });
        console.log("temp:", temp);
        // const time = await Model.TaskTimer.aggregate(aggregateTimer(data))
        // const timerData = await Model.TaskTimer.aggregate([
        //     {
        //         $unwind: { path: "$data", preserveNullAndEmptyArrays: true }
        //     },
        //     {
        //         $match: { isDeleted: false, taskId: mongoose.Types.ObjectId(data._id) }
        //     },
        //     // {
        //     //     $group: {
        //     //         _id: null,
        //     //         Data: { "$addToSet": "$data" }
        //     //     }
        //     // }
        // ])

        return {
            data: data,
            // TaskTimerData: timerData,
            // time: time
        }
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

//Total Task counter
async function totalTaskHour(queryData) {
    try {
        const { skip = undefined, limit = undefined, search, taskId } = queryData;
        const condition = { isDeleted: false }
        if (taskId)
            condition._id = mongoose.Types.ObjectId(taskId)

        const aggregate = [
            { $match: { ...condition } }
        ];

        if (typeof skip !== "undefined" && typeof limit !== "undefined") {
            aggregate.push({ $skip: skip }, { $limit: limit }, { $sort: sorting })
        }

        aggregate.push(
            // {
            //     $lookup: {
            //         from: "projects",
            //         let: { "project": "$projectId" },
            //         pipeline: [
            //             {
            //                 $match: {
            //                     $expr: {
            //                         $and: [
            //                             { $eq: ["$_id", "$$project"] }
            //                         ]
            //                     }
            //                 }
            //             },
            //             {
            //                 $project: {
            //                     title: 1,
            //                     description: 1,
            //                     // employeeId: 1,
            //                     startDate: 1,
            //                     endDate: 1
            //                 }
            //             }
            //         ],
            //         as: "ProjectData"
            //     }
            // },
            // {
            //     $unwind: { path: "$ProjectData", preserveNullAndEmptyArrays: true }
            // },
            // {
            //     $unwind: { path: "$employeeId", preserveNullAndEmptyArrays: true }
            // },
            // {
            //     $lookup: {
            //         from: "employees",
            //         let: { "employee": "$employeeId" },
            //         pipeline: [
            //             {
            //                 $match: {
            //                     $expr: {
            //                         $and: [
            //                             { $eq: ['$_id', "$$employee"] }
            //                         ]
            //                     }
            //                 }
            //             },
            //             {
            //                 $project: {
            //                     firstName: 1
            //                 }
            //             }
            //         ],
            //         as: "EmployeeData"
            //     }
            // },
            // {
            //     $unwind: { path: "$EmployeeData", preserveNullAndEmptyArrays: true }
            // },
            {
                $lookup: {
                    from: "tasktimers",
                    let: { "taskId": "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$taskId', "$$taskId"] }
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                taskId: 1,
                                projectId: 1,
                                startTime: 1,
                                endTime: 1,
                                addedBy: 1
                            }
                        },
                        {
                            $group: {
                                _id: "$addedBy",
                                taskId: { "$first": "$taskId" },
                                projectId: { "$first": "$projectId" },
                                employeeId: { "$addToSet": "$addedBy" },
                                startTime: { "$addToSet": "$startTime" },
                                endTime: { "$addToSet": "$endTime" },
                                Hour: {
                                    $sum: { $divide: [{ $subtract: ['$endTime', '$startTime'] }, 3600000], }
                                },

                            }
                        }
                    ],
                    as: "TaskTimerData"
                }
            },
            {
                $unwind: { path: "$TaskTimerData", preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    _id: 1,
                    task: 1,
                    projectId: 1,
                    employeeId: 1,
                    status: 1,
                    ProjectData: 1,
                    EmployeeData: 1,
                    TaskTimerData: 1,
                    timerTaskData: {
                        _id: "$TaskTimerData._id",
                        taskId: "$TaskTimerData.taskId",
                        projectId: "$TaskTimerData.projectId",
                        employeeId: "$TaskTimerData.addedBy",
                        startTime: "$TaskTimerData.startTime",
                        endTime: "$TaskTimerData.endTime",
                        // Hour: { $divide: [{ $subtract: ['$TaskTimerData.endTime', '$TaskTimerData.startTime'] }, 3600000], }
                    },
                }
            },
            {
                $group: {
                    _id: "$_id",
                    task: { "$first": "$task" },
                    projectId: { "$first": "$projectId" },
                    employeeId: { "$addToSet": "$employeeId" },
                    status: { "$first": "$status" },
                    ProjectData: { "$addToSet": "$ProjectData" },
                    EmployeeData: { "$addToSet": "$EmployeeData" },
                    TaskTimerData: { "$addToSet": "$TaskTimerData" },
                    WorkingHour: { $sum: "$TaskTimerData.Hour" },
                    // timer: { "$addToSet": "$timerTaskData" },
                }
            },
        )
        let data = await Model.Task.aggregate(aggregate);
        //get TaskTimer Using Logic
        // let arr = [];
        // await data.map((item) => {
        //     const timer = item.timer;
        //     let obj = {};
        //     let sum = 0;
        //     timer.map((item) => {
        //         let demo = {
        //             taskId: item.taskId,
        //             projectId: item.projectId,
        //             emp: item.employeeId,
        //             startTime: item.startTime,
        //             endTime: item.endTime,
        //             hour: item.Hour
        //         }
        //         console.log("demo:", demo);
        //         Object.assign(obj, { child: [] })
        //         obj.child = demo;

        //         // let flag = arr.filter((element) => {
        //         //     console.log("arrFilter:", element);
        //         //     console.log("id", element.emp, demo.emp)
        //         //     if (element.emp === demo.emp) {
        //         //         console.log("objchild:", obj.child)
        //         //         element.hour += demo.hour
        //         //     }
        //         // })

        //         let temp = arr.map((arrItem) => {
        //             console.log("Array:", arrItem);
        //             const arrItemId = arrItem.emp;
        //             console.log("arrItemId:", arrItemId);
        //             if (arrItemId === demo.emp) {
        //                 console.log("id", arrItem.emp, demo.emp)
        //                 // arrItem.hour += demo.hour
        //             }
        //         })

        //         arr.push(obj.child);
        //         console.log("arr:", arr);
        //         // let temoRes = arr.map((arrItem, arrIndex) => {
        //         //     if (arrItem.emp) {
        //         //         if (arrItem.emp === demo.emp) {
        //         //             console.log("dfesdhssk", arrItem.emp, demo.emp)
        //         //         }
        //         //     }
        //         // })
        //     })
        // })
        return {
            data: data
        }
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    }
}

async function timerReduce(queryData) {
    try {
        const mapfunction = function () {
            emit(this.addedBy, this.startTime)
        }
        const reducefunction = function (keyValue) {
            return keyValue
        }
        let data = await Service.getData(Model.TaskTimer);
        console.log("data:", data);
        let flag = data.filter((item) => (item.taskId === queryData.taskId));
        console.log("flag:", flag);

        // data.reduce(function () {
        //     emit(data.taskId)
        // });
        console.log("data2:", data);
        let list = Model.TaskTimer.mapReduce(
            mapfunction(),
            reducefunction(),
            { out: "Task_Timer" }
        );
        let find = Task_Timer.find();
        console.log("find:", find);
    } catch (err) {
        console.log(err);
        return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
    }
}

module.exports = {
    addEditTask,
    viewTask,
    changeStatus,
    viewTaskDetail,
    totalTaskHour,
    timerReduce
}