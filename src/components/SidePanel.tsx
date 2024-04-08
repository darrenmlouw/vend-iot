import { Button } from '@/components/ui/button';
import { DashboardIcon } from '@radix-ui/react-icons';
import { HomeIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

function SidePanel() {
	return (
		//a side panel that can expand and collapse, with a list of buttons that can be clicked to navigate to different pages
		// as well as a button to toggle the side panel
		// rounded topright and bottomright corners with shadow
		<div className="flex flex-col bg-card p-2 space-y-2 rounded-tr-[4] rounded-br-[4] rounded-r-lg">
			<Link to="/home">
				<Button variant="ghost" size="icon" className="rounded">
					<HomeIcon className="h-6 w-6" />
				</Button>
			</Link>

			<Link to="/dashboard">
				<Button variant="ghost" size="icon" className="rounded">
					<DashboardIcon className=" h-6 w-6" />
				</Button>
			</Link>
		</div>
	);
}

export default SidePanel;
