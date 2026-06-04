import SideBar from "../components/SideBar";
import TopBar from "../components/TopBar";
import AuthWrapper from "../components/AuthWrapper";

export default function ViewLayout({ children }) {
  return (
    <AuthWrapper>
      <div className="flex h-screen">

        {/* Sidebar */}
        <SideBar />

        <div className="flex-1 flex flex-col">

          {/* Topbar */}
          <TopBar />

          {/* Page Content */}
          <main className="pt-6 px-6 pb-6 bg-gray-50 flex-1 overflow-y-auto">
            {children}
          </main>

        </div>

      </div>
    </AuthWrapper>
  );
}