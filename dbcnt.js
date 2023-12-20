const oracledb = require('oracledb')

const cns = {
    user: "c##telecart",
    //user: "SYSTEM",
    password: "telecart",
    //password: "abcd77",
    connectString: "localhost/orcl"
}

async function queryDB(sql, params, autoCommit){
    let connection;
    try{
        connection = await oracledb.getConnection(cns);
        console.log("Successfully connected to the database")

        let result = await connection.execute(sql, params, {autoCommit: autoCommit})
        await connection.close()
        return result
    } catch (err){
        console.log(err)
    }
}

module.exports = queryDB
