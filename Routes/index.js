"use strict"

const userRoutes = require("../Routes/userRoutes");
const adminRoutes = require("../Routes/adminRoutes");
const employeeRooutes = require("../Routes/employeeRoutes");
const taskRoutes = require("../Routes/taskRoutes");
const departmentRoutes = require("../Routes/departmentRoutes");
const ex = require("../Routes/exRoutes");
const LocalData = require("../Routes/localdataRoutes");


const all = [].concat(userRoutes, adminRoutes, employeeRooutes, taskRoutes, departmentRoutes, ex, LocalData);

module.exports = all;