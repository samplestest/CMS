
let config = require('../Config');
let nodemailer = require('nodemailer');
let sesTransport = require('nodemailer-ses-transport');
const { google } = require('googleapis');

exports.sendEmail = async function (email, subject, content, attachment) {

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.mail,
            pass: Process.env.code
        },
    });

    return new Promise((resolve, reject) => {
        let obj = {
            from: process.env.mail, // sender address
            to: email, // list of receivers
            subject: subject, // Subject line
            html: content
        };
        if (attachment)
            obj.attachments = attachment

        transporter.sendMail(obj, (err, res) => {
            console.log('send mail', err, res);
            resolve()
        });
    })
};
