const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const createDB = require("./dbConfig.js");
const { ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

//Base Route
app.get("/", async (req, res) => {
  return res
    .status(200)
    .json({ status: true, message: "Escrow Contract Server" });
});

//add the contract to the database
app.post("/contracts", async (req, res, next) => {
  const { address, beneficiary, arbiter, value } = req.body;
  if (!address || !arbiter || !beneficiary || !value)
    return res
      .status(400)
      .json({ status: false, message: "Some Fields are empty" });

  //connect DB
  const dbData = await createDB();
  if (dbData.error == true) {
    return res
      .status(500)
      .json({ status: false, message: "Internal Server Error" });
  }
  const { escrowDb } = dbData;

  let contractCollection = escrowDb.collection("contracts");
  const savedDocument = await contractCollection.insertOne({
    address,
    arbiter,
    beneficiary,
    value,
    status: false,
    refunded: false,
    createdAt: new Date(),
  });

  return res
    .status(200)
    .json({ status: true, message: "Contract saved to DB", savedDocument });
});

//update the contract in the database using the contract Id
app.patch("/contracts/:contractId", async (req, res, next) => {
  const { contractId } = req.params;
  const { status, refunded } = req.body;

  if (status == null)
    return res
      .status(422)
      .json({ status: false, message: "Status of contract is required" });
  //connect DB
  const dbData = await createDB();
  if (dbData.error == true) {
    return res
      .status(500)
      .json({ status: false, message: "Internal Server Error" });
  }
  const { escrowDb } = dbData;

  let setObject = {};
  if (status) {
    setObject.status = status;
  }

  if (refunded) {
    setObject.refunded = refunded;
  }

  const contractCollection = escrowDb.collection("contracts");
  const updatedContract = await contractCollection.updateOne(
    { _id: new ObjectId(contractId) },
    {
      $set: {
        ...setObject,
        updatedAt: new Date(),
      },
    }
  );

  return res
    .status(200)
    .json({ status: true, message: "status updated", updatedContract });
});

//Get all the contracts
app.get("/contracts", async (req, res) => {
  let pipeline = [];
  if (req.query.status) {
    // query.status = req.query.status; //Note that true means the contract is approved and false means not approved
    if (["true", "false"].includes(req.query.status)) {
      pipeline.push({
        $match: {
          status: req.query.status,
        },
      });
    }
  }

  const dbData = await createDB();
  if (dbData.error == true) {
    return res
      .status(500)
      .json({ status: false, message: "Internal Server Error" });
  }
  const { escrowDb } = dbData;

  const contractCollection = escrowDb.collection("contracts");
  const contracts = await contractCollection.aggregate(pipeline).toArray();

  return res
    .status(200)
    .json({ status: true, message: "All contracts", contracts });
});

app.listen(3000, () => {
  console.log(`App is running on PORT http://localhost:${3000}`);
});
