/**
 * RESTPollingClient.js
 * 
 * This helper client polls the provided list of URLs at the provided polling interval,
 * and publishes the results of the REST calls on the provided topics using the 
 * provided Solace client.
 * 
 * @author Andrew Roberts
 */

import { makeRequest } from "./HttpClient";

function getFormattedElapsedTime(ms) {
  let roundedMs = 1000 * Math.round(ms/1000); // round to nearest second
  let tempDateObj = new Date(roundedMs);
  if(tempDateObj.getUTCMinutes() > 0) {
    return `${tempDateObj.getUTCMinutes()} minutes ${tempDateObj.getUTCSeconds()} seconds`;
  } else {
    return `${tempDateObj.getUTCSeconds()} seconds`;
  }
}

function RESTPollingClient(urlList, pollingInterval) {
  let client = {};
  client.activeIntervals = [];
  client.urlList = urlList;
  client.requestsCount = 0;
  client.responsesCount = 0;
  client.sessionStartTime = null;
  client.sessionEndTime = null;
  
  client.start = function start() {
    return new Promise((resolve, reject) => {
      // initialize clean session
      client.reset();
      client.sessionStartTime = new Date();
      // start intervals for each of the provided urls
      for(let url of client.urlList) {
        const requestParams = {
          baseUrl: url,
          method: "GET"
        };
        let intervalObj = setInterval(async function intervalCallback() {
          let res;
          try {
            ++client.requestsCount;
            res = await makeRequest(requestParams);
            ++client.responsesCount;
          } catch (err) {
            reject(err);
          }
        }, pollingInterval);

        client.activeIntervals.push(intervalObj);
      }

      resolve();
    })  
  }

  client.stop = function stop() {
    for(let intervalObj of client.activeIntervals) {
      clearInterval(intervalObj);
    }
    client.activeIntervals = [];
    client.sessionEndTime = new Date();
  }

  client.reset = function reset() {
    client.stop();
    client.activeIntervals = [];
    client.requestsCount = 0;
    client.responsesCount = 0;
    client.sessionEndTime = null;
    client.sessionStartTime = null;
  }

  client.finish = function finish() {
    console.log();
    console.log("*-*-*-*-*-*-*-*-*-*-*");
    console.log("* RESTPollingClient")
    console.log("*-*-*-*-*-*-*-*-*-*-*");
    console.log(`Session stats`)
    console.log(`- Duration:            ${getFormattedElapsedTime(client.sessionEndTime - client.sessionStartTime)}`);
    console.log(`- Start time:          ${client.sessionStartTime.toLocaleTimeString()}`);
    console.log(`- End time:            ${client.sessionEndTime.toLocaleTimeString()}`);
    console.log(`- Requests sent:       ${client.requestsCount}`);
    console.log(`- Responses received:  ${client.responsesCount}`);
    console.log();
  }

  return client;
}

export default RESTPollingClient;
