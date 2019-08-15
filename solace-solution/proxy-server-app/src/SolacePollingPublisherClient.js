/**
 * PollingHelper.js
 * 
 * This helper client polls the provided list of URLs at the provided polling interval,
 * and publishes the results of the REST calls on the provided topics using the 
 * provided Solace client.
 * 
 * @author Andrew Roberts
 */

import { makeRequest } from "./HttpClient";
import SolaceTopicPublisher from "./SolaceTopicPublisher";

function getFormattedTimeFromMs(ms) {
  let roundedMs = 1000 * Math.round(ms/1000); // round to nearest second
  let tempDateObj = new Date(roundedMs);
  if(tempDateObj.getUTCMinutes() > 0) {
    return `${tempDateObj.getUTCMinutes()} minutes ${tempDateObj.getUTCSeconds()} seconds`;
  } else {
    return `${tempDateObj.getUTCSeconds()} seconds`;
  }
}

function SolacePollingPublisherClient(urlTopicPairs, pollingInterval) {
  let client = {};
  client.solaceClient = null;
  client.urlTopicPairs = urlTopicPairs;
  client.activeIntervals = [];
  client.messagesPublishedCount = 0;
  client.requestsCount = 0;
  client.responsesCount = 0;
  
  client.connect = function connect() {
    return new Promise(async (resolve, reject) => {
      let solaceClient = SolaceTopicPublisher();
      try {
        await solaceClient.connectToSolace()
        client.solaceClient = solaceClient;
        resolve();
      } catch (err) {
        reject(err);
      }
    })  
  }

  client.start = function start() {
    return new Promise(async (resolve, reject) => {
      // initialize clean session
      client.reset();
      client.sessionStartTime = new Date();
      try {
        await client.connect()
      } catch (err) {
        reject(err);
      }
      // start intervals for each of the provided urls
      for(let url in client.urlTopicPairs) {
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
            client.solaceClient.publish(client.urlTopicPairs[url], JSON.stringify(res.data));
            ++client.messagesPublishedCount;
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
    client.messagesPublished = 0;
    client.requestsCount = 0;
    client.responsesCount = 0;
  }

  client.finish = function finish() {
    console.log();
    console.log("*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*");
    console.log("* SolacePollingPublisherClient")
    console.log("*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*");
    console.log(`Session stats`)
    console.log(`- Duration:            ${getFormattedTimeFromMs(client.sessionEndTime - client.sessionStartTime)}`);
    console.log(`- Start time:          ${client.sessionStartTime.toLocaleTimeString()}`);
    console.log(`- End time:            ${client.sessionEndTime.toLocaleTimeString()}`);
    console.log(`- Requests sent:       ${client.requestsCount}`);
    console.log(`- Responses received:  ${client.responsesCount}`);
    console.log(`- Messages published:  ${client.messagesPublishedCount}`);
    console.log();
  }

  return client;
}



export default SolacePollingPublisherClient;
