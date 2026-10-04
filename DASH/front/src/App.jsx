import { BrowserRouter } from "react-router-dom";
import DashboardRoutes from "./routes/DashboardRoutes.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <DashboardRoutes />
    </BrowserRouter>
  );
}
