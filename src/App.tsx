import Dashboard from './components/Dashboard';
import './App.css';
import { Route, Routes, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import { TopBarProvider } from '@/contexts/TopBarContext';
import { MQTTProvider } from '@/contexts/MQTTContext';
import Home from '@/components/Home';
import { TimestreamProvider } from '@/contexts/TimesteamContext';

const App = () => {
	const location = useLocation();

	return (
		<TimestreamProvider>
			<MQTTProvider>
				<TopBarProvider>
					<div className="App">
						<Routes location={location}>
							<Route path="/" element={<Layout />}>
								<Route index path="" element={<Home />} />
							</Route>
						</Routes>
					</div>
				</TopBarProvider>
			</MQTTProvider>
		</TimestreamProvider>
	);
};

export default App;
