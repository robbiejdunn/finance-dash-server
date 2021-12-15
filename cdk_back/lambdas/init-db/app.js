var response = require('cfn-response');
const { Client } = require('pg');

exports.handler = async(event, context) => {
    const requestType = event['RequestType'];
    console.log(`${requestType} event received`)

    let responseStatus = response.FAILED;
    if (requestType === 'Delete') {
        responseStatus = response.SUCCESS;
    } else {
        // create database if it doesn't already exist
        const createDbClient = new Client({
            user: process.env.PGUSER,
            host: process.env.PGHOST,
            database: 'postgres',
            password: process.env.PGPASSWORD,
            port: process.env.PGPORT,
        });
        await createDbClient.connect();
        const res = await createDbClient.query('CREATE DATABASE FinanceDashDB');
        console.log(res);
        await createDbClient.end();
        // connect to postgres RDS instance
        // const client = new Client();
        // await client.connect();
        // const res = await client.query('CREATE TABLE transactions(did integer PRIMARY KEY, price integer, cname varchar(40))');
        // console.log(res);
        // await client.end();
    }
    return response.send(event, context, responseStatus, {});
};
