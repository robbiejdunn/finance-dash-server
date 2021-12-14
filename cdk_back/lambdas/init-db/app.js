var response = require('cfn-response');
const { Client } = require('pg');

exports.handler = async(event, context) => {
    const requestType = event['RequestType'];
    console.log(`${requestType} event received`)

    let responseStatus = response.FAILED;
    if (requestType === 'Delete') {
        responseStatus = response.SUCCESS;
    } else {
        // connect to postgres RDS instance
        console.log(`PGUSER: ${process.env.PGUSER}`)
        console.log(`PGHOST: ${process.env.PGHOST}`)
        console.log(`PGPASSWORD: ${process.env.PGPASSWORD}`)
        console.log(`PGDATABASE: ${process.env.PGDATABASE}`)
        console.log(`PGPORT: ${process.env.PGPORT}`)
        const client = new Client();
        await client.connect();
        const res = await client.query('CREATE TABLE transactions(did integer PRIMARY KEY, price integer, cname varchar(40))');
        console.log(res);
        await client.end();
    }
    return response.send(event, context, responseStatus, {});
};
