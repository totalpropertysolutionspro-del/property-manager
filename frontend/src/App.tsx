import { useState, useEffect } from "react";
import Login from "./components/Login";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Properties from "./components/Properties";
import Tenants from "./components/Tenants";
import Tickets from "./components/Tickets";
import Incidents from "./components/Incidents";
import Invoices from "./components/Invoices";
import Vendors from "./components/Vendors";
import Contacts from "./components/Contacts";
import Staff from "./components/Staff";
import Calendar from "./components/Calendar";
import Files from "./components/Files";
import Reminders from "./components/Reminders";
import Emails from "./components/Emails";
import Messages from "./components/Messages";

export type Page =
  | "dashboard"
  | "properties"
  | "tenants"
  | "tickets"
  | "incidents"
  | "invoices"
  | "vendors"
  | "contacts"
  | "staff"
  | "calendar"
  | "files"
  | "reminders"
  | "emails"
  | "messages";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("tps_token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogin = () => setIsLoggedIn(true);

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const navigateTo = (page: string) => {
    setCurrentPage(page as Page);
    setSidebarOpen(false);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":   return <Dashboard setCurrentPage={navigateTo} />;
      case "properties":  return <Properties />;
      case "tenants":     return <Tenants />;
      case "tickets":     return <Tickets />;
      case "incidents":   return <Incidents />;
      case "invoices":    return <Invoices />;
      case "vendors":     return <Vendors />;
      case "contacts":    return <Contacts />;
      case "staff":       return <Staff />;
      case "calendar":    return <Calendar />;
      case "files":       return <Files />;
      case "reminders":   return <Reminders />;
      case "emails":      return <Emails />;
      case "messages":    return <Messages />;
      default:            return <Dashboard setCurrentPage={navigateTo} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={navigateTo}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuToggle={() => setSidebarOpen((o) => !o)} />
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
