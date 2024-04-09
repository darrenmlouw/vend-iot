import { Button } from '@/components/ui/button';
import { PaperPlaneIcon } from '@radix-ui/react-icons';
import { useMQTTContext } from '@/contexts/MQTTContext';
import { useTimestream } from '@/contexts/TimesteamContext';

import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	ChartData,
	BubbleDataPoint,
	Point,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useEffect, useState } from 'react';

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend
);

const Home = () => {
	const mqttContext = useMQTTContext();
	const { machineStatusStream, vendEventsStream } = useTimestream();
	const [machineStatusData, setMachineStatusData] = useState<ChartData>({
		labels: [],
		datasets: [],
	});

	const [vendEventsData, setVendEventsData] = useState<ChartData>({
		labels: [],
		datasets: [],
	});

	useEffect(() => {
		setMachineStatusData({
			labels: machineStatusStream.map(
				(status) =>
					`${new Date(status.time).getFullYear()}-${
						new Date(status.time).getMonth() + 1
					}-${new Date(status.time).getDate()} ${new Date(
						status.time
					).getHours()}:${new Date(status.time).getMinutes()}`
			),
			datasets: [
				{
					label: 'DC',
					data: machineStatusStream.map((status) => {
						if (status.DC === 0) {
							return (
								machineStatusStream
									.slice(0, machineStatusStream.indexOf(status))
									.reverse()
									.find((status) => status.DC !== 0)?.DC ?? 0
							);
						}
						return status.DC ?? 0;
					}),
					borderColor: 'rgb(75, 192, 192)',
					backgroundColor: 'rgba(75, 192, 192, 0.5)',
				},
			],
			yLabels: ['DC', 'Ambient', 'Exhaust'],
		});

		setVendEventsData({
			labels: vendEventsStream.map(
				(event) =>
					`${new Date(event.time).getFullYear()}-${
						new Date(event.time).getMonth() + 1
					}-${new Date(event.time).getDate()} ${new Date(
						event.time
					).getHours()}:${new Date(event.time).getMinutes()}`
			),
			datasets: [
				{
					label: 'Price',
					data: vendEventsStream.map((event) => event.price as number),
					borderColor: 'rgb(53, 162, 235)',
					backgroundColor: 'rgba(53, 162, 235, 0.5)',
				},
			],
		});
	}, [machineStatusStream, vendEventsStream]);

	return (
		<div className=" w-full  p-4 space-y-2 overflow-y-visible">
			<div className="flex sticky top-0 z-30 bg-background">
				<h1 className="text-2xl md:text-3xl lg:text-4xl">MQTT</h1>
			</div>

			{mqttContext.isConnected && (
				<div className="space-y-2 overflow-y-visible">
					<div className="flex flex-col p-2 md:flex-row md:space-x-4 space-y-4 md:space-y-0 overflow-y-auto">
						{mqttContext.topics.map((topic) => (
							<div
								key={topic}
								className="bg-card shadow-md rounded-lg max-h-[29vh] min-h-60  w-full overflow-y-auto"
							>
								<div className="pt-4 pb-2 flex items-center gap-2 px-4 justify-between sticky top-0 bg-card flex-wrap">
									<span className="text-sm font-semibold">{topic}</span>
									<div className="flex items-center">
										<Button
											onClick={() => mqttContext.subscribe(topic)}
											className={`px-2 py-1 text-xs font-semibold rounded ${
												mqttContext.subscribedTopics[topic]
													? 'hidden'
													: 'bg-blue-500 hover:bg-blue-600 text-white'
											}`}
										>
											Subscribe
										</Button>
										<Button
											onClick={() => mqttContext.unsubscribe(topic)}
											className={`px-2 py-1 text-xs font-semibold rounded ${
												mqttContext.subscribedTopics[topic]
													? 'bg-red-500 hover:bg-red-600 text-white'
													: 'hidden'
											}`}
										>
											Unsubscribe
										</Button>
									</div>
								</div>

								{topic === 'reactTest/freeVend' &&
									mqttContext.isConnected &&
									mqttContext.canSendMessage && (
										<div className="flex flex-row justify-between w-full pl-4 pr-4 gap-2 flex-wrap sticky top-16 bg-card pb-2">
											<select
												value={mqttContext.messageContent.product}
												onChange={(e) =>
													mqttContext.setMessageContent(() => {
														return {
															product: e.target.value,
														};
													})
												}
												className="border-2 border-gray-200 p-2 rounded flex-1 bg-slate dark:bg-slate-950 dark:border-gray-800"
											>
												<option value="WATER">WATER</option>
												<option value="ICE">ICE</option>
											</select>
											<Button
												onClick={mqttContext.handlePublishMessage}
												className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
											>
												<PaperPlaneIcon className="mr-2" />
												Send
											</Button>
											{/* </div> */}
										</div>
									)}

								<div className="flex flex-col w-full rounded">
									{topic === 'reactTest/status' && mqttContext.isConnected && (
										<div
											id="messagesContainer"
											className="flex-grow overflow-y-auto rounded-lg p-4 space-y-2"
										>
											{mqttContext.machineStatusBuffer.map((msg, index) => (
												<div
													key={index}
													className="p-2 bg-slate-200 dark:bg-slate-800 shadow-inner rounded"
												>
													<pre className="whitespace-pre-wrap text-xs sm:text-sm">
														<strong>Message:</strong>{' '}
														{JSON.stringify(msg.message, null, 2)}
													</pre>
												</div>
											))}
										</div>
									)}

									{topic === 'reactTest/freeVend' &&
										mqttContext.isConnected && (
											<div
												id="messagesContainer"
												className="flex-grow overflow-y-auto rounded-lg p-4 space-y-2 "
											>
												{mqttContext.sentMessagesBuffer.map((msg, index) => (
													<div
														key={index}
														className="p-2 bg-slate-200 dark:bg-slate-800 rounded shadow-inner "
													>
														<pre className="whitespace-pre-wrap text-xs sm:text-sm">
															<strong>Message:</strong>{' '}
															{JSON.stringify(msg.message, null, 2)}
														</pre>
													</div>
												))}
											</div>
										)}

									{topic === 'reactTest/vendEvents' &&
										mqttContext.isConnected && (
											<div
												id="messagesContainer"
												className="flex-grow overflow-y-auto rounded-lg p-4 space-y-2 "
											>
												{mqttContext.vendEventsBuffer.map((msg, index) => (
													<div
														key={index}
														className="p-2 bg-slate-200 dark:bg-slate-800 rounded shadow-inner "
													>
														<pre className="whitespace-pre-wrap text-xs sm:text-sm">
															<strong>Message:</strong>{' '}
															{JSON.stringify(msg.message, null, 2)}
														</pre>
													</div>
												))}
											</div>
										)}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			<div className="flex z-30 bg-background">
				<h1 className="text-2xl md:text-3xl lg:text-4xl">TimeStream</h1>
			</div>

			{mqttContext.isConnected && (
				<div className="w-full p-4 space-y-2 overflow-y-visible">
					<div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 overflow-y-auto">
						<div className="w-full md:h-64 lg:h-96">
							<h2 className="text-lg font-semibold mb-2">
								Machine Status Over Time
							</h2>
							<Line
								data={
									machineStatusData as ChartData<
										'line',
										(
											| number
											| [number, number]
											| Point
											| BubbleDataPoint
											| null
										)[],
										unknown
									>
								}
								options={{
									responsive: true,
									scales: {
										x: {
											title: {
												display: true,
												text: 'Time',
											},
										},
										y: {
											title: {
												display: true,
												text: 'Temperature',
											},
										},
									},

									//set point radius to 0
									elements: {
										point: {
											radius: 0,
										},
									},
									//add tooltips
								}}
							/>
						</div>
						<div className="w-full md:h-64 lg:h-96">
							<h2 className="text-lg font-semibold mb-2">
								Vend Events Over Time
							</h2>
							<Line
								data={
									vendEventsData as ChartData<
										'line',
										(
											| number
											| [number, number]
											| Point
											| BubbleDataPoint
											| null
										)[],
										unknown
									>
								}
								options={{
									responsive: true,
									scales: {
										x: {
											title: {
												display: true,
												text: 'Time',
											},
										},
										y: {
											title: {
												display: true,
												text: 'Price',
											},
										},
									},
									//set point radius to 0
									elements: {
										point: {
											radius: 0,
										},
									},
								}}
								// type="line"
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Home;
