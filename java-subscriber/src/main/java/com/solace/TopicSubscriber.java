/**
 *  Copyright 2012-2019 Solace Corporation. All rights reserved.
 *
 *  http://www.solace.com
 *
 *  This source is distributed under the terms and conditions
 *  of any contract or contracts between Solace and you or
 *  your company. If there are no contracts in place use of
 *  this source is not authorized. No support is provided and
 *  no distribution, sharing with others or re-use of this
 *  source is authorized unless specifically stated in the
 *  contracts referred to above.
 *
 * HelloWorldSub
 *
 * This sample shows the basics of creating session, connecting a session,
 * subscribing to a topic, and receiving a message. This is meant to be a
 * very basic example for demonstration purposes.
 */

package com.solace;

import java.util.concurrent.CountDownLatch;
import java.util.Scanner;

import com.solacesystems.jcsmp.*;

public class TopicSubscriber {

    // EXAMPLE ARGUMENTS:  tcp://mrrwtxvkmpdxv.messaging.solace.cloud:20000  bar1-subscriber@msgvpn-zpfs1b9g8px 4r43sbnrcsh8cj2r57oav619k7 bar1/demo 1000
    public static void main(String... args) throws JCSMPException {

        // Validate command line args
        if (args.length < 2 || args[1].split("@").length != 2) {
            System.out.println("Usage: TopicSubscriber <host:port> <client-username@message-vpn> [client-password]");
            System.exit(-1);
        }
        if (args[1].split("@")[0].isEmpty()) {
            System.out.println("No client-username entered");
            System.exit(-1);
        }
        if (args[1].split("@")[1].isEmpty()) {
            System.out.println("No message-vpn entered");
            System.exit(-1);
        }

        // Store command line args
        final String hostWithPort = args[0];
        final String clientUsername = args[1].split("@")[0];
        final String msgVpn = args[1].split("@")[1];
        final String password = args[2];
        final String topicName = args[3];

        System.out.println("TopicSubscriber initializing...");
        final JCSMPProperties properties = new JCSMPProperties();
        properties.setProperty(JCSMPProperties.HOST, hostWithPort);     // host:port
        properties.setProperty(JCSMPProperties.USERNAME, clientUsername); // client-username
        properties.setProperty(JCSMPProperties.VPN_NAME,  msgVpn); // message-vpn
        JCSMPChannelProperties cp = (JCSMPChannelProperties) properties
                .getProperty(JCSMPProperties.CLIENT_CHANNEL_PROPERTIES);
        cp.setCompressionLevel(1);
        if (args.length > 2) {
            properties.setProperty(JCSMPProperties.PASSWORD, password); // client-password
        }
        final Topic topic = JCSMPFactory.onlyInstance().createTopic(topicName);
        final JCSMPSession session = JCSMPFactory.onlyInstance().createSession(properties);

        session.connect();

        Scanner scanner = new Scanner(System.in);
        while (scanner.hasNextLine()){
            String line = scanner.nextLine();
            System.out.println(line);
        }

        // synchronizing b/w threads
        /** Anonymous inner-class for MessageListener
         *  This demonstrates the async threaded message callback */
        final XMLMessageConsumer cons = session.getMessageConsumer(new XMLMessageListener() {
            @Override
            public void onReceive(BytesXMLMessage msg) {
                if (msg instanceof TextMessage) {
                    System.out.println(String.format("TextMessage received: '%s'%n",
                            ((TextMessage)msg).getText()));
                } else {
                    System.out.println("Message received.");
                }
                System.out.println(String.format("Message Dump:%n%s%n",msg.dump()));
            }

            @Override
            public void onException(JCSMPException e) {
                System.out.println(String.format("Consumer received exception: %s%n",e));
            }
        });
        session.addSubscription(topic);
        System.out.println("Connected. Awaiting message...");
        cons.start();
        // Consume-only session is now hooked up and running!
    }
}
