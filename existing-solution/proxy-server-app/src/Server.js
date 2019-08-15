/**
 * Server.js
 * Implementation of an Express.js server that forwards all requests received to
 * the appropriate IEX Cloud API endpoint.  This proxy server is useful to us because
 * it will let us cleanly measure network egress from a cloud.
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
import { makeRequest } from "./HttpClient";

async function start() {
  /* initialize our Express server */
  const server = express();
  server.use(express.json());

  /* initialize endpoints */
  // - GET QUOTE
  server.get("/stock/:symbol/quote", async (req, res) => {
    // validate request
    const { symbol } = req.params;
    if (!symbol) {
      throw new Error("No symbol provided!");
    } 
    // forward request to IEX Cloud API
    const requestParams = {
      baseUrl: process.env.IEX_CLOUD_BASE_ENDPOINT,
      endpoint: `/stock/${symbol}/quote?token=${encodeURIComponent(process.env.IEX_CLOUD_SECRET_TOKEN)}`,
      method: "GET"
    };
    let proxyRes;
    try {
      proxyRes = await makeRequest(requestParams);
    } catch (err) {
      throw new Error(err);
    }
    // form response
    res.set({
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    });
    res.send(proxyRes.data);
  });

  /* start the server */
  server.listen(process.env.EXPRESS_PORT, process.env.EXPRESS_HOST);
  console.log(
    `Running on http://${process.env.EXPRESS_HOST}:${
      process.env.EXPRESS_PORT
    }...`
  );
}

start();
