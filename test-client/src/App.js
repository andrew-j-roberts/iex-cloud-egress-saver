/**
 * app.js
 * Testing CLI for IEX Cloud 
 * Polls a randomly distributed list of symbols at the provided interval
 * @author Andrew Roberts
 */

// load regenerator-runtime and env variables before anything else
import "regenerator-runtime";
import dotenv from "dotenv";
let result = dotenv.config();
if (result.error) {
  throw result.error;
}

import { makeRequest } from "./HttpClient";
import { symbolList } from "./symbolList";
import RESTPollingClient from "./RESTPollingClient";
// import SolacePollingSubscriberClient from "./SolacePollingSubscriberClient";

/**
 * Helper functions
 */

function getFormattedTimeFromMs(ms) {
  let roundedMs = 1000 * Math.round(ms/1000); // round to nearest second
  let tempDateObj = new Date(roundedMs);
  if(tempDateObj.getUTCMinutes() > 0) {
    return `${tempDateObj.getUTCMinutes()} minutes ${tempDateObj.getUTCSeconds()} seconds`;
  } else {
    return `${tempDateObj.getUTCSeconds()} seconds`;
  }
}

function getRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Main function
 */
async function start(symbolCount, pollingInterval, testDuration) {
  // generate a distributed list of symbols and form their REST URLs and Solace topics
  let symbolMap = {};
  let urls = [];
  let topics = [];
  for(let i = 0; i<symbolCount; i++) {
    let symbolIndex = Math.round(getRandomNumber(0, symbolList.length));
    let symbol = encodeURIComponent(symbolList[symbolIndex].symbol);  // encoding _only_ done on client!!
    while(symbolMap[symbol]){
      symbolIndex = Math.round(getRandomNumber(0, symbolList.length)); 
      symbol = encodeURIComponent(symbolList[symbolIndex].symbol);
    }
    symbolMap[symbol] = true;
    urls.push(`${process.env.REST_APP_BASE_ENDPOINT}/stock/${symbol}/quote`);
    topics.push(`T/${symbol}`);
  }
  // initialize clients
  let restPollingClient = RESTPollingClient(urls, pollingInterval);
  //let solacePollingSubscriberClient = SolacePollingSubscriberClient(topics);
  try {
    // start receiving clients
    await restPollingClient.start();
    // await solacePollingSubscriberClient.start(); ---> Replaced by JAVA APP for SMF compatability BOOOOO
    // send start signal to SolacePollingPublisherClient
    const requestParams = {
      baseUrl: process.env.SOLACE_APP_BASE_ENDPOINT,
      endpoint: `/start`,
      method: "POST",
      body: {
        symbols: Object.keys(symbolMap),
        pollingInterval: pollingInterval
      }
    };
    await makeRequest(requestParams);
  } catch(err) {
    console.log(err);
    process.exit(1);
  }

  // stop test after specified amount of time
  setTimeout(function stop(){
    restPollingClient.stop();
    solacePollingSubscriberClient.stop();
    restPollingClient.finish();
    solacePollingSubscriberClient.finish();
    exit(0);
  }, testDuration);

  // program will run until it is told to exit
  console.log(`Running test for ${getFormattedTimeFromMs(testDuration)}...`);
  process.stdin.resume();

  process.on("SIGINT", function() {
    process.exit();
  });
}

// validate CLI args and start program
const args = process.argv.slice(2);
if(args.length < 3 || args.length > 3) {
  console.log("USAGE: node app.js <SYMBOL_COUNT> <POLLING_INTERVAL> <TEST_DURATION_MS>");
  process.exit();
} else {
  const CLI_ARG_SYMBOL_COUNT = args[0];
  const CLI_ARG_POLLING_INTERVAL = args[1];
  const CLI_ARG_TEST_DURATION = args[2];
  start(CLI_ARG_SYMBOL_COUNT, CLI_ARG_POLLING_INTERVAL, CLI_ARG_TEST_DURATION);
}
