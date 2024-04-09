import { Button } from '@/components/ui/button';
import { HomeIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

function SidePanel() {
	const { pathname } = useLocation();

	return (
		<div className="flex flex-col bg-card p-2 space-y-2 rounded-r-lg shadow-xl">
			<Link to="/">
				<Button
					variant={pathname === '/' ? 'outline' : 'ghost'}
					size="icon"
					className="rounded"
				>
					<HomeIcon className="h-6 w-6" />
				</Button>
			</Link>
		</div>
	);
}

export default SidePanel;
