// src/contexts/TimestreamContext.tsx

import { createContext, useContext, ReactNode, useState } from 'react';
import { awsConfig } from '../utils/awsConfig';
import {
	setConfiguration,
	query as timestreamQuery,
} from '@/services/timestream';
import MachineStatus from '@/types/MachineStatus';
import VendEvent from '@/types/VendEvent';

// Define a type for the context state
type TimestreamContextType = {
	fetchDataFromTimestream: (
		database: string,
		tableName: string,
		timePeriodInHours: number
	) => Promise<unknown[]>;
	machineStatusStream: MachineStatus[];
	setMachineStatusStream: React.Dispatch<React.SetStateAction<MachineStatus[]>>;
	vendEventsStream: VendEvent[];
	setVendEventsStream: React.Dispatch<React.SetStateAction<VendEvent[]>>;
};

// Create the context
const TimestreamContext = createContext<TimestreamContextType | undefined>(
	undefined
);

// Define a provider for the context
export const TimestreamProvider = ({ children }: { children: ReactNode }) => {
	const [machineStatusStream, setMachineStatusStream] = useState<
		MachineStatus[]
	>([]);
	const [vendEventsStream, setVendEventsStream] = useState<VendEvent[]>([]);

	setConfiguration(awsConfig.region, {
		accessKeyId: awsConfig.accessKeyId,
		secretAccessKey: awsConfig.secretAccessKey,
		sessionToken: awsConfig.sessionToken,
	});

	const fetchDataFromTimestream = async (
		database: string,
		tableName: string,
		timePeriodInHours: number
	) => {
		let queryString = '';

		if (tableName === 'machineStatus') {
			queryString = `SELECT
			(CASE WHEN measure_name = 'hostname' THEN measure_value::varchar ELSE NULL END) as hostname,
			(CASE WHEN measure_name = 'exhaust' THEN measure_value::double ELSE NULL END) as exhaust,
			time,
			(CASE WHEN measure_name = 'ambient' THEN measure_value::double ELSE NULL END) as ambient,
			(CASE WHEN measure_name = 'DC' THEN measure_value::double ELSE NULL END) as DC
			FROM "${database}"."${tableName}" 
			WHERE time >= ago(${timePeriodInHours}h)
			AND measure_name IN ('DC', 'exhaust', 'ambient', 'hostname')
			ORDER BY time DESC`;
		} else if (tableName === 'vendEvents') {
			queryString = `SELECT time, 
			(CASE WHEN measure_name = 'price' THEN measure_value::bigint ELSE NULL END) AS price
			FROM "${database}"."${tableName}" 
			WHERE time >= ago(${timePeriodInHours}h)
			AND measure_name IN ('price')
			ORDER BY time DESC`;
		}

		console.log('Querying Timestream:', queryString);

		try {
			const data = await timestreamQuery(queryString);
			console.log(`${database} -> ${tableName}: `, data);
			return data.Rows || [];
		} catch (error) {
			console.error('Error querying Timestream:', error);
			return [];
		}
	};

	return (
		<TimestreamContext.Provider
			value={{
				fetchDataFromTimestream,
				machineStatusStream,
				setMachineStatusStream,
				vendEventsStream,
				setVendEventsStream,
			}}
		>
			{children}
		</TimestreamContext.Provider>
	);
};

export const useTimestream = () => {
	const context = useContext(TimestreamContext);
	if (context === undefined) {
		throw new Error('useTimestream must be used within a TimestreamProvider');
	}
	return context;
};
