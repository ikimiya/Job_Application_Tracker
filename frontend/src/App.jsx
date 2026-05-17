import "./App.css";
import JobList from "./components/JobList";

export default function App() {
  return (
    <div className="app-shell">
      <nav className="navbar">
        <span className="navbar-dot" aria-hidden="true" />
        <span className="navbar-title">Job Application Tracker</span>
      </nav>
      <main className="app-content">
        <JobList />
      </main>
    </div>
  );
}
