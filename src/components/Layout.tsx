import SidePanel from '@/components/SidePanel';
import TopBar from '@/components/TopBar';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
		<div className="flex flex-row h-full w-full">
      <SidePanel />
      <div className="flex flex-col w-full">
        <TopBar />
        <div className="flex flex-col overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;