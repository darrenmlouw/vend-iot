import { Button } from '@/components/ui/button';
import { useTopBar } from '@/contexts/TopBarContext';
import { ReloadIcon, SunIcon } from '@radix-ui/react-icons';
import { MoonIcon } from 'lucide-react';
import { useMQTTContext } from '@/contexts/MQTTContext';
import { useTimestream } from '@/contexts/TimesteamContext';
import { awsConfig } from '@/utils/awsConfig';
import MachineStatus from '@/types/MachineStatus';
import VendEvent from '@/types/VendEvent';
import Product from '@/types/Product';

type TimestreamValue = { ScalarValue?: string; NullValue?: boolean };
type TimestreamRow = { Data: TimestreamValue[] };

const machineStatusMeasures = [
  { name: 'temperature', type: 'DOUBLE' },
  { name: 'humidity', type: 'DOUBLE' },
  // Add more measures as needed
];

const vendEventsMeasures = [
  { name: 'price', type: 'DOUBLE' },
  // Add more measures as needed
];

const TopBar = () => {
	const { theme, toggleTheme } = useTopBar();
	const mqttConext = useMQTTContext();
	const {
		fetchDataFromTimestream,
		setMachineStatusStream,
		setVendEventsStream,
	} = useTimestream();

	const handleConnectClick = () => {
		const machineStatusData = fetchDataFromTimestream(
			awsConfig.timestreamDatabase,
			awsConfig.timestreamTables.machineStatus,
			0.1
		);
		const vendEventsData = fetchDataFromTimestream(
			awsConfig.timestreamDatabase,
			awsConfig.timestreamTables.vendEvents,
			8
		);

		if (mqttConext.isConnected) {
			mqttConext.disconnect();
		} else {
			mqttConext.connect();
		}

		Promise.all([machineStatusData, vendEventsData]).then((data: unknown[]) => {
			console.log('data', data);
			console.log('data[0]', data[0]);

			const machineStatuses = (data[0] as TimestreamRow[]).map(
				(d: TimestreamRow) => {
					console.log('d', d.Data);

					console.log(
						'd[0] as TimestreamRow',
						(d.Data as TimestreamValue[])[0]
					);
					console.log('Time: ', (d.Data as TimestreamValue[])[2].ScalarValue);
					console.log(
						'exhaust: ',
						(d.Data as TimestreamValue[])[1].ScalarValue
							? parseFloat((d.Data as TimestreamValue[])[1].ScalarValue!)
							: -5
					);

					return {
						time: new Date(
							(d.Data as TimestreamValue[])[2].ScalarValue!
						).getTime(),
						hostname: (d.Data as TimestreamValue[])[0].ScalarValue || 'Unknown',
						DC: isNaN(
							parseFloat((d.Data as TimestreamValue[])[4].ScalarValue ?? '')
						)
							? 0
							: parseFloat((d.Data as TimestreamValue[])[4].ScalarValue!),
						ambient: isNaN(
							parseFloat((d.Data as TimestreamValue[])[3].ScalarValue ?? '')
						)
							? 0
							: parseFloat((d.Data as TimestreamValue[])[3].ScalarValue!),
						exhaust: isNaN(
							parseFloat((d.Data as TimestreamValue[])[1].ScalarValue ?? '')
						)
							? 0
							: parseFloat((d.Data as TimestreamValue[])[1].ScalarValue!),
					} as MachineStatus;
				}
			);

			// const vendEvents = (data[1] as TimestreamRow[]).map(
			// 	(d: TimestreamRow) => {
			// 		// console.log('Time: ', new Date((d.Data as TimestreamValue[])[3].ScalarValue!).getTime());
			// 		// console.log('Product: ', (d.Data as TimestreamValue[])[0].ScalarValue);
			// 		// console.log('Payment Type: ', (d.Data as TimestreamValue[])[1].ScalarValue);
			// 		// console.log('Price: ', (d.Data as TimestreamValue[])[2].ScalarValue);

			// 		return {
			// 			time: new Date(
			// 				(d.Data as TimestreamValue[])[3].ScalarValue!
			// 			).getTime(),
			// 			product: {
			// 				product:
			// 					(d.Data as TimestreamValue[])[0].ScalarValue || undefined,
			// 			} as Product,
			// 			paymentType:
			// 				(d.Data as TimestreamValue[])[1].ScalarValue || undefined,
			// 			price: isNaN(
			// 				Number((d.Data as TimestreamValue[])[2].ScalarValue ?? '')
			// 			)
			// 				? 0
			// 				: (d.Data as TimestreamValue[])[2].ScalarValue || undefined,
			// 		} as VendEvent;
			// 	}
			// );

			setMachineStatusStream(machineStatuses);
			// setVendEventsStream(vendEvents);
		});
	};

	return (
		// create a top bar with a light an ddark mode toggle on the top-right side of the screen
		<div className="flex flex-row space-x-2 w-ful pt-2 pr-2 pl-2 justify-end sticky top-0">
			<Button
				size="icon"
				onClick={handleConnectClick}
				className={`inline-flex items-center justify-center px-4 py-1 rounded font-bold w-auto ${
					mqttConext.isConnected
						? 'bg-red-500 hover:bg-red-600'
						: 'bg-green-500 hover:bg-green-600'
				} text-white`}
			>
				{mqttConext.isLoading && <ReloadIcon className="animate-spin mr-2" />}
				{mqttConext.isConnected ? 'Disconnect' : 'Connect'}
			</Button>

			<Button
				size="icon"
				variant="ghost"
				onClick={toggleTheme}
				className="rounded-full"
			>
				{theme === 'dark' ? (
					<SunIcon className="h-5 w-5" />
				) : (
					<MoonIcon className="h-5 w-5" />
				)}
			</Button>
		</div>
	);
};

export default TopBar;
