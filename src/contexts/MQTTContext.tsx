import { createContext, ReactNode, useContext, useState } from 'react';
import { useMQTT } from '../hooks/useMQTT';
import { awsConfig } from '../utils/awsConfig';
import MachineStatus from '@/types/MachineStatus';
import VendEvent from '@/types/VendEvent';
import Product from '@/types/Product';

const topics = [
	'reactTest/status',
	'reactTest/freeVend',
	'reactTest/vendEvents',
];

interface MQTTContextType {
	isConnected: boolean;
	connect: () => void;
	disconnect: () => void;
	subscribedTopics: Record<string, boolean>;
	subscribe: (topic: string) => void;
	unsubscribe: (topic: string) => void;
	isLoading: boolean;
	sendMessage: (topic: string, message: string) => void;
	machineStatusBuffer: { topic: string; message: MachineStatus }[];
	setMachineStatusBuffer: React.Dispatch<
		React.SetStateAction<{ topic: string; message: MachineStatus }[]>
	>;
	vendEventsBuffer: { topic: string; message: VendEvent }[];
	setVendEventsBuffer: React.Dispatch<
		React.SetStateAction<{ topic: string; message: VendEvent }[]>
	>;
	sentMessagesBuffer: { topic: string; message: Product }[];
	canSendMessage: boolean;
	handlePublishMessage: () => void;
	messageContent: Product;
	setMessageContent: React.Dispatch<React.SetStateAction<Product>>;
	topics: string[];
}

const MQTTContext = createContext<MQTTContextType | undefined>(undefined);

export const MQTTProvider = ({ children }: { children: ReactNode }) => {
	const [machineStatusBuffer, setMachineStatusBuffer] = useState<
		{ topic: string; message: MachineStatus }[]
	>([]);
	const [vendEventsBuffer, setVendEventsBuffer] = useState<
		{ topic: string; message: VendEvent }[]
	>([]);
	const [sentMessagesBuffer, setSentMessagesBuffer] = useState<
		{ topic: string; message: Product }[]
	>([]);
	const [messageContent, setMessageContent] = useState({ product: 'WATER' });

	const handleReceivedMessage = (topic: string, message: string) => {
		if (topic === 'reactTest/status') {
			const machineStatus: MachineStatus = JSON.parse(message);
			setMachineStatusBuffer((prevStatus) => [
				...prevStatus,
				{ topic, message: machineStatus },
			]);
		} else if (topic === 'reactTest/vendEvents') {
			const vendEvent: VendEvent = JSON.parse(message);
			setVendEventsBuffer((prevEvents) => [
				...prevEvents,
				{ topic, message: vendEvent },
			]);
		}
	};

	const mqttHook = useMQTT(
		awsConfig.clientId,
		awsConfig.mqttEndpoint,
		awsConfig.region,
		awsConfig.accessKeyId,
		awsConfig.secretAccessKey,
		awsConfig.sessionToken,
		topics,
		handleReceivedMessage
	);

	const canSendMessage =
		mqttHook.subscribedTopics['reactTest/vendEvents'] &&
		mqttHook.subscribedTopics['reactTest/freeVend'];

	const handlePublishMessage = () => {
		const topic = 'reactTest/freeVend';
		mqttHook.sendMessage(topic, JSON.stringify({ product: messageContent }));
		setSentMessagesBuffer((prevMessages) => [
			...prevMessages,
			{ topic, message: messageContent },
		]);
	};

	return (
		<MQTTContext.Provider
			value={{
				...mqttHook,
				machineStatusBuffer,
				setMachineStatusBuffer,
				vendEventsBuffer,
				setVendEventsBuffer,
				sentMessagesBuffer,
				canSendMessage,
				handlePublishMessage,
				messageContent,
				setMessageContent,
				topics,
			}}
		>
			{children}
		</MQTTContext.Provider>
	);
};

// eslint-disable-next-line react-refresh/only-export-components
export const useMQTTContext = () => {
	const context = useContext(MQTTContext);
	if (!context) {
		throw new Error('useMQTTContext must be used within a MQTTProvider');
	}
	return context;
};
