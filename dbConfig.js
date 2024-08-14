const { MongoClient } = require("mongodb");
require("dotenv").config();

const connectionString = process.env.MONGO_URL || "";

const client = new MongoClient(connectionString);
//get a client
module.exports = async function createDB() {
  let conn;
  try {
    //connect the client
    conn = await client.connect();
    const escrowDb = conn.db("escrow-contracts");
    return { error: false, escrowDb, client };
  } catch (error) {
    console.error(error);
    return { error: true, message: error.message };
  }
};
