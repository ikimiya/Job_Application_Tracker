import { BrowserRouter, Routes, Route, NavLink, useNavigate } from "react-router-dom";
import "./App.css";
import JobList from "./components/JobList";
import JobForm from "./components/JobForm";
import Analytics from "./components/Analytics";
import EditJob from "./components/EditJob";

function NavBar() {
    return (
        <nav className="navbar">
            <span className="navbar-dot" aria-hidden="true" />
            <span className="navbar-title">Job Application Tracker</span>
            <div className="navbar-links">
                <NavLink
                    to="/"
                    end
                    className={({ isActive }) => "navbar-link" + (isActive ? " navbar-link--active" : "")}
                >
                    Applications
                </NavLink>
                <NavLink
                    to="/add"
                    className={({ isActive }) => "navbar-link" + (isActive ? " navbar-link--active" : "")}
                >
                    Add Job
                </NavLink>
                <NavLink
                    to="/analytics"
                    className={({ isActive }) => "navbar-link" + (isActive ? " navbar-link--active" : "")}
                >
                    Analytics
                </NavLink>
            </div>
        </nav>
    );
}

function AddJobPage() {
    const navigate = useNavigate();

    // JobList remounts on every navigation to /, so it always refetches —
    // no refreshKey wiring needed across routes
    function handleJobAdded() {
        navigate("/");
    }

    return <JobForm onJobAdded={handleJobAdded} />;
}

export default function App() {
    return (
        <BrowserRouter>
            <div className="app-shell">
                <NavBar />
                <main className="app-content">
                    <Routes>
                        <Route path="/"           element={<JobList />} />
                        <Route path="/add"        element={<AddJobPage />} />
                        <Route path="/analytics"  element={<Analytics />} />
                        <Route path="/edit/:id"   element={<EditJob />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}