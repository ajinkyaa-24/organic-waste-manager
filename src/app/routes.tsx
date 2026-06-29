import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { AddEntry } from "./components/common/AddEntry";
import { History } from "./components/common/History";
import { LiveMonitoring } from "./pages/LiveMonitoring";
import { AdminPanel } from "./pages/AdminPanel";
import { ProfilePage } from "./pages/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { AboutPage } from "./pages/AboutPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "add-entry", Component: AddEntry },
      { path: "history", Component: History },
      { path: "live-monitoring", Component: LiveMonitoring },
      { path: "admin", Component: AdminPanel },
      { path: "profile", Component: ProfilePage },
      { path: "settings", Component: SettingsPage },
      { path: "reports", Component: ReportsPage },
      { path: "about", Component: AboutPage },
    ],
  },
  {
    path: "/reset-password",
    Component: ResetPasswordPage,
  },
]);
