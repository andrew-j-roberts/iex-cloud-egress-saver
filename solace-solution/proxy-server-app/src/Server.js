/**
 * Server.js
 * @author Andrew Roberts
 */

// load regenerator-runtime and env variables before anything else
import "regenerator-runtime";
import dotenv from "dotenv";
let result = dotenv.config();
if (result.error) {
  throw result.error;
}

import express from "express";
import SolacePollingPublisherClient from "./SolacePollingPublisherClient";

async function start() {
  // initialize express server
  const server = express();
  server.use(express.json());
  // initialize endpoints
  server.post("/start", async (req, res) => {
    const { symbols, pollingInterval } = req.body;
    if (!symbols || !pollingInterval) {
      throw new Error(
        "Invalid request: please provide both a list of symbols and a polling interval."
      );
    }
    let urlTopicPairs = {};
    for (let symbol of symbols) {
      let url = `${
        process.env.IEX_CLOUD_BASE_ENDPOINT
      }/stock/${symbol}/quote?token=${encodeURIComponent(
        process.env.IEX_CLOUD_SECRET_TOKEN
      )}`;
      let topic = `T/${symbol}`;
      urlTopicPairs[url] = topic;
    }
    // initialize and start polling client that will publish on the broker
    let solacePollingPublisherClient = SolacePollingPublisherClient(
      urlTopicPairs,
      pollingInterval
    );
    try {
      await solacePollingPublisherClient.start();
    } catch(err) {
      console.log(err);
      process.exit(1);
    }
    // form response
    res.set({
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    });
    res.send({ status: "SERVER STARTED!" });
  });

  // start the express server
  server.listen(process.env.EXPRESS_PORT, process.env.EXPRESS_HOST);
  console.log(
    `Running on http://${process.env.EXPRESS_HOST}:${
      process.env.EXPRESS_PORT
    }...`
  );
}

start();
