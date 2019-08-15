/**
 * SolacePollingSubscriberClient.js
 * 
 * This helper client polls the provided list of URLs at the provided polling interval,
 * and publishes the results of the REST calls on the provided topics using the 
 * provided Solace client.
 * 
 * @author Andrew Roberts
 */

import SolaceTopicSubscriber from "./SolaceTopicSubscriber";

function getFormattedTimeFromMs(ms) {
  let roundedMs = 1000 * Math.round(ms/1000); // round to nearest second
  let tempDateObj = new Date(roundedMs);
  if(tempDateObj.getUTCMinutes() > 0) {
    return `${tempDateObj.getUTCMinutes()} minutes ${tempDateObj.getUTCSeconds()} seconds`;
  } else {
    return `${tempDateObj.getUTCSeconds()} seconds`;
  }
}

function SolacePollingSubscriberClient(topicList) {
  let client = {};
  client.solaceClient = null;
  client.topicList = topicList;
  client.activeTopicSubscriptions = [];
  client.messagesReceived = 0;
  client.sessionStartTime = null;
  client.sessionEndTime = null;
  
  client.connect = function connect() {
    return new Promise(async (resolve, reject) => {
      let solaceClient = SolaceTopicSubscriber(function messageReceivedCallback(msg) {
        ++client.messagesReceived;
      });
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
      // subscribe to each provided topic
      for(let topic of topicList) {
        client.solaceClient.subscribe(topic);
        client.activeTopicSubscriptions.push(topic);
      }
      
      resolve();
    })  
  }

  client.stop = function stop() {
    for(let topic of client.activeTopicSubscriptions) {
      client.solaceClient.unsubscribe(topic);
    }
    client.activeTopicSubscriptions = [];
    client.sessionEndTime = new Date();
  }

  client.reset = function reset() {
    client.stop();
    client.activeTopicSubscriptions = [];
    client.messagesReceived = 0;
    client.sessionStartTime = null;
    client.sessionEndTime = null;
  }

  client.finish = function finish() {
    console.log();
    console.log("*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*");
    console.log("* SolacePollingSubscriberClient")
    console.log("*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*");
    console.log(`Session stats`)
    console.log(`- Duration:            ${getFormattedTimeFromMs(client.sessionEndTime - client.sessionStartTime)}`);
    console.log(`- Start time:          ${client.sessionStartTime.toLocaleTimeString()}`);
    console.log(`- End time:            ${client.sessionEndTime.toLocaleTimeString()}`);
    console.log(`- Messages received:   ${client.messagesReceived}`);
    console.log();
  }

  return client;
}

export default SolacePollingSubscriberClient;
