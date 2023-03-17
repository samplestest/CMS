const HapiCron = require('hapi-cron');

const HapiSwagger = require('hapi-swagger');
const Pack = require('../package');
const Config = require('../Config');

exports.plugin = {
    name: 'HapiCron',
    register: async (server, option) => {
        const swaggerOptions = {
            jobs: [{
                name: 'testcron',
                time: '0 */12 * * *',
                timezone: 'Asia/Kolkata',
                request: {
                    method: 'POST',
                    url: '/admin/crons'
                },
            },
            {
                name: 'salaryNotification',
                time: '* * 10 * *',
                timezone: 'Asia/Kolkata',
                request: {
                    method: 'POST',
                    url: '/admin/salaryNotifications'
                },
            },
            ]
            // info: {
            //     title: Config.dbConfig.config.swaggerName + ' Documentation',
            //     version: Pack.version,
            //     // enableDocumentation: process.env.NODE_ENV == "prod" ? false : true
            // },
        };
        await server.register([
            require('@hapi/inert'),
            require('@hapi/vision')]);
        if (!(process.env.NODE_ENV == "prod"))
            await server.register([
                {
                    plugin: HapiCron,
                    options: swaggerOptions
                }
            ]);
    }


};
