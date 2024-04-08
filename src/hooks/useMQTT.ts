import { useCallback, useState } from 'react';
import { Client, Message } from 'paho-mqtt';
import moment from 'moment';
import { SigV4Utils } from '../utils/sigV4Utils';

export const useMQTT = (
	clientId: string,
	endpoint: string,
	regionProp: string,
	accessKeyId: string,
	secretAccessKey: string,
	sessionToken: string,
	topics: string[],
	onMessageReceived: (topic: string, message: string) => void
) => {
	const [client, setClient] = useState<Client | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const [subscribedTopics, setSubscribedTopics] = useState<
		Record<string, boolean>
	>({});
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const generateAWSIoTSigV4 = () => {
		// Get timestamp and format data
		const time = moment.utc();
		const dateStamp = time.format('YYYYMMDD');
		const amzdate = dateStamp + 'T' + time.format('HHmmss') + 'Z';

		// Define constants used to create the message to be signed
		const service: string = 'iotdevicegateway';
		const region: string = regionProp;
		const secretKey: string = secretAccessKey;
		const accessKey: string = accessKeyId;
		const algorithm: string = 'AWS4-HMAC-SHA256';
		const method: string = 'GET';
		const canonicalUri: string = '/mqtt';
		const host: string = endpoint;

		// Set credential scope to today for a specific service in a specific region
		const credentialScope =
			dateStamp + '/' + region + '/' + service + '/' + 'aws4_request';

		// Start populating the query string
		let canonicalQuerystring = 'X-Amz-Algorithm=AWS4-HMAC-SHA256';
		canonicalQuerystring +=
			'&X-Amz-Credential=' +
			encodeURIComponent(accessKey + '/' + credentialScope);
		canonicalQuerystring += '&X-Amz-Date=' + amzdate;
		canonicalQuerystring += '&X-Amz-Expires=86400';
		canonicalQuerystring += '&X-Amz-SignedHeaders=host';
		const canonicalHeaders = 'host:' + host + '\n';
		const payloadHash =
			'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'; // empty string hash
		const canonicalRequest =
			method +
			'\n' +
			canonicalUri +
			'\n' +
			canonicalQuerystring +
			'\n' +
			canonicalHeaders +
			'\nhost\n' +
			payloadHash;
		// console.log('canonicalRequest: \n' + canonicalRequest);

		// Hash the canonical request and create the message to be signed
		const stringToSign =
			algorithm +
			'\n' +
			amzdate +
			'\n' +
			credentialScope +
			'\n' +
			SigV4Utils.sha256(canonicalRequest);
		const signingKey = SigV4Utils.getSignatureKey(
			secretKey,
			dateStamp,
			region,
			service
		);
		// console.log('stringToSign: \n', stringToSign);
		// console.log('signingKey: \n', signingKey);

		// Calculate signature
		const signature = SigV4Utils.sign(signingKey, stringToSign);
		canonicalQuerystring += '&X-Amz-Signature=' + signature;

		// Append existing security token to the request (since we are using STS credentials) or do nothing if using IAM credentials
		if (sessionToken !== '') {
			canonicalQuerystring +=
				'&X-Amz-Security-Token=' + encodeURIComponent(sessionToken);
		}

		const requestUrl =
			'wss://' + host + canonicalUri + '?' + canonicalQuerystring;

		console.log('MQTT RequestUrl: ', requestUrl);

		return requestUrl;
	};

	const connect = useCallback(() => {
		setIsLoading(true);
		const url = generateAWSIoTSigV4();
		const mqttClient = new Client(url, clientId);

		mqttClient.onConnectionLost = onConnectionLost;
		mqttClient.onMessageArrived = onMessageArrived;

		mqttClient.connect({
			onSuccess: () => {
				setIsConnected(true);
				setIsLoading(false);
				setClient(mqttClient);
			},
			onFailure: (error) => {
				console.error('Connection failed:', error);
				setIsLoading(false);
			},
			useSSL: true,
			timeout: 3,
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [generateAWSIoTSigV4]);

	const disconnect = useCallback(() => {
		if (client) {
			client.disconnect();
			setIsConnected(false);
			setSubscribedTopics({});
		}
	}, [client]);

	const subscribe = useCallback(
		(topic: string) => {
			if (client && isConnected && !subscribedTopics[topic]) {
				setIsLoading(true);
				client.subscribe(topic, {
					onSuccess: () => {
						setSubscribedTopics((prev) => ({ ...prev, [topic]: true }));
						setIsLoading(false);
					},
					onFailure: (error) => {
						console.error(`Subscribe to ${topic} failed:`, error);
						setIsLoading(false);
					},
				});
			}
		},
		[client, isConnected, subscribedTopics]
	);

	const unsubscribe = useCallback(
		(topic: string) => {
			if (client && isConnected && subscribedTopics[topic]) {
				setIsLoading(true);
				client.unsubscribe(topic, {
					onSuccess: () => {
						setSubscribedTopics((prev) => {
							const updated = { ...prev };
							delete updated[topic];
							return updated;
						});
						setIsLoading(false);
					},
					onFailure: (error) => {
						console.error(`Unsubscribe from ${topic} failed:`, error);
						setIsLoading(false);
					},
				});
			}
		},
		[client, isConnected, subscribedTopics]
	);

	const sendMessage = useCallback(
		(topic: string, message: string) => {
			if (client && isConnected) {
				const mqttMessage = new Message(message);
				mqttMessage.destinationName = topic;
				client.send(mqttMessage);
			}
		},
		[client, isConnected]
	);

	const onMessageArrived = useCallback(
		(message: Message) => {
			if (topics.includes(message.destinationName)) {
				onMessageReceived(message.destinationName, message.payloadString);
			}
		},
		[onMessageReceived, topics]
	);

	const onConnectionLost = useCallback((responseObject: unknown) => {
		console.log('Connection Lost:', responseObject);
		setIsConnected(false);
		setSubscribedTopics({});
	}, []);

	return {
		isConnected,
		connect,
		disconnect,
		subscribedTopics,
		subscribe,
		unsubscribe,
		isLoading,
		sendMessage,
	};
};

// import { useCallback, useEffect, useState } from 'react';
// import { Client, Message } from 'paho-mqtt';
// import moment from 'moment';
// import { awsConfig } from '../utils/awsConfig';
// import { SigV4Utils } from '../utils/sigV4Utils';

// export const useMQTT = (
// 	clientId: string,
// 	endpoint: string,
// 	region: string,
// 	accessKeyId: string,
// 	secretAccessKey: string,
// 	sessionToken: string
// ) => {
// 	const [client, setClient] = useState<Client | null>(null);
// 	const [isConnected, setIsConnected] = useState(false);
// 	const [isSubscribed, setIsSubscribed] = useState(false);
// 	const [receivedMessage, setReceivedMessage] = useState<string>();
// 	const [isLoading, setIsLoading] = useState<boolean>(false);

// 	const generateAWSIoTSigV4 = () => {
// 		// Get timestamp and format data
// 		const time = moment.utc();
// 		const dateStamp = time.format('YYYYMMDD');
// 		const amzdate = dateStamp + 'T' + time.format('HHmmss') + 'Z';

// 		// Define constants used to create the message to be signed
// 		const service: string = 'iotdevicegateway';
// 		const region: string = awsConfig.region;
// 		const secretKey: string = awsConfig.secretAccessKey;
// 		const accessKey: string = awsConfig.accessKeyId;
// 		const algorithm: string = 'AWS4-HMAC-SHA256';
// 		const method: string = 'GET';
// 		const canonicalUri: string = '/mqtt';
// 		const host: string = awsConfig.mqttEndpoint;

// 		// Set credential scope to today for a specific service in a specific region
// 		const credentialScope =
// 			dateStamp + '/' + region + '/' + service + '/' + 'aws4_request';

// 		// Start populating the query string
// 		let canonicalQuerystring = 'X-Amz-Algorithm=AWS4-HMAC-SHA256';
// 		canonicalQuerystring +=
// 			'&X-Amz-Credential=' +
// 			encodeURIComponent(accessKey + '/' + credentialScope);
// 		canonicalQuerystring += '&X-Amz-Date=' + amzdate;
// 		canonicalQuerystring += '&X-Amz-Expires=86400';
// 		canonicalQuerystring += '&X-Amz-SignedHeaders=host';
// 		const canonicalHeaders = 'host:' + host + '\n';
// 		const payloadHash =
// 			'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'; // empty string hash
// 		const canonicalRequest =
// 			method +
// 			'\n' +
// 			canonicalUri +
// 			'\n' +
// 			canonicalQuerystring +
// 			'\n' +
// 			canonicalHeaders +
// 			'\nhost\n' +
// 			payloadHash;
// 		console.log('canonicalRequest: \n' + canonicalRequest);

// 		// Hash the canonical request and create the message to be signed
// 		const stringToSign =
// 			algorithm +
// 			'\n' +
// 			amzdate +
// 			'\n' +
// 			credentialScope +
// 			'\n' +
// 			SigV4Utils.sha256(canonicalRequest);
// 		const signingKey = SigV4Utils.getSignatureKey(
// 			secretKey,
// 			dateStamp,
// 			region,
// 			service
// 		);
// 		console.log('stringToSign: \n', stringToSign);
// 		console.log('signingKey: \n', signingKey);

// 		// Calculate signature
// 		const signature = SigV4Utils.sign(signingKey, stringToSign);
// 		canonicalQuerystring += '&X-Amz-Signature=' + signature;

// 		// Append existing security token to the request (since we are using STS credentials) or do nothing if using IAM credentials
// 		if (awsConfig.sessionToken !== '') {
// 			canonicalQuerystring +=
// 				'&X-Amz-Security-Token=' + encodeURIComponent(awsConfig.sessionToken);
// 		}

// 		const requestUrl =
// 			'wss://' + host + canonicalUri + '?' + canonicalQuerystring;
// 		console.log(requestUrl);

// 		return requestUrl;
// 	};

// 	const connect = useCallback(() => {
// 		setIsLoading(true);
// 		if (client) {
// 			client.connect({
// 				onSuccess: () => {
// 					setIsConnected(true)
// 					setIsLoading(false);
// 				},
// 				onFailure: (error) => console.error('Connection failed:', error),
// 				useSSL: true,
// 				timeout: 3,
// 			});
// 		}

// 	}, [client]);

// 	const disconnect = useCallback(() => {
// 		setIsLoading(true);
// 		if (client) {
// 			client.disconnect();
// 			setIsConnected(false);
// 			setIsSubscribed(false); // Reset subscribed state on disconnect
// 		}
// 		setIsLoading(false);
// 	}, [client]);

// 	const subscribe = useCallback(
// 		(topic: string) => {
// 			setIsLoading(true);
// 			if (client && isConnected) {
// 				client.subscribe(topic, {
// 					onSuccess: () => setIsSubscribed(true),
// 					onFailure: (error) => console.error('Subscribe failed:', error),
// 				});
// 			}
// 			setIsLoading(false);
// 		},
// 		[client, isConnected]
// 	);

// 	const unsubscribe = useCallback(
// 		(topic: string) => {
// 			setIsLoading(true);
// 			if (client && isConnected) {
// 				client.unsubscribe(topic, {
// 					onSuccess: () => setIsSubscribed(false),
// 					onFailure: (error) => console.error('Unsubscribe failed:', error),
// 				});
// 			}
// 			setIsLoading(false);
// 		},
// 		[client, isConnected]
// 	);

// 	const sendMessage = useCallback(
// 		(topic: string, message: string) => {
// 			setIsLoading(true);
// 			if (client && isConnected) {
// 				const mqttMessage = new Message(message);
// 				mqttMessage.destinationName = topic;
// 				client.send(mqttMessage);
// 			}
// 			setIsLoading(false);
// 		},
// 		[client, isConnected]
// 	);

// 	const onMessageArrived = useCallback((message: Message) => {
// 		setReceivedMessage(message.payloadString);
// 	}, []);

// 	const onConnectionLost = useCallback((responseObject: unknown) => {
// 		console.log('Connection Lost:', responseObject);
// 		setIsConnected(false);
// 		setIsSubscribed(false);
// 	}, []);

// 	useEffect(() => {
// 		console.log('Generating AWS IoT SigV4 URL');
// 		const url = generateAWSIoTSigV4();
// 		const mqttClient = new Client(url, clientId);
// 		mqttClient.onConnectionLost = onConnectionLost;
// 		mqttClient.onMessageArrived = onMessageArrived;
// 		setClient(mqttClient);
// 	}, [
// 		clientId,
// 		endpoint,
// 		region,
// 		accessKeyId,
// 		secretAccessKey,
// 		sessionToken,
// 		onConnectionLost,
// 		onMessageArrived,
// 	]);

// 	return {
// 		isConnected,
// 		connect,
// 		disconnect,
// 		isSubscribed,
// 		subscribe,
// 		unsubscribe,
// 		isLoading,
// 		sendMessage,
// 		receivedMessage,
// 	};
// };
