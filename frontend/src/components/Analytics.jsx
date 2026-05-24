import { useState, useEffect } from "react";
import "./Analytics.css";

const API = "http://localhost:8000";

const STATUS_ORDER = ["applied", "interview", "offer", "rejected", "ghosted"];

const STATUS_META = {
    applied:   { label: "Applied",   color: "#2563eb", light: "#eff6ff" },
    interview: { label: "Interview", color: "#7c3aed", light: "#f5f3ff" },
    offer:     { label: "Offer",     color: "#16a34a", light: "#f0fdf4" },
    rejected:  { label: "Rejected",  color: "#dc2626", light: "#fef2f2" },
    ghosted:   { label: "Ghosted",   color: "#a8a29e", light: "#fafaf9" },
};

const CARD_META = [
    { key: "total",     label: "Total",     color: "#0f172a", light: "#f1f5f9" },
    ...STATUS_ORDER.map(s => ({ key: s, ...STATUS_META[s] })),
];

export default function Analytics() {
    const [jobs, setJobs]       = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);

    useEffect(() => {
        fetch(`${API}/jobs`)
            .then(res => {
                if (!res.ok) throw new Error(`Server responded ${res.status}`);
                return res.json();
            })
            .then(data => { setJobs(data); setLoading(false); })
            .catch(e  => { setError(e.message); setLoading(false); });
    }, []);

    // counts keyed by status, plus total
    const counts = STATUS_ORDER.reduce((acc, s) => {
        acc[s] = jobs.filter(j => j.status?.toLowerCase() === s).length;
        return acc;
    }, { total: jobs.length });

    // bar chart max is the largest individual status count so bars fill the space well
    const barMax = Math.max(1, ...STATUS_ORDER.map(s => counts[s]));

    // last 5 jobs by date_applied descending
    const recent = [...jobs]
        .sort((a, b) => b.date_applied.localeCompare(a.date_applied))
        .slice(0, 5);

    return (
        <div className="an-wrapper">
            <h2 className="an-heading">Analytics</h2>

            {loading && <p className="an-meta">Loading…</p>}
            {error   && <p className="an-meta an-meta--error">Failed to load jobs: {error}</p>}

            {!loading && !error && (
                <>
                    {/* summary cards */}
                    <div className="an-cards">
                        {CARD_META.map(({ key, label, color, light }) => (
                            <div key={key} className="an-card" style={{ borderTopColor: color }}>
                                <span className="an-card-value" style={{ color }}>{counts[key]}</span>
                                <span className="an-card-label">{label}</span>
                            </div>
                        ))}
                    </div>

                    {/* horizontal bar chart — pure CSS, no library */}
                    <section className="an-section">
                        <h3 className="an-section-heading">Status Breakdown</h3>
                        <div className="an-bars">
                            {STATUS_ORDER.map(s => {
                                const { label, color, light } = STATUS_META[s];
                                const pct = counts[s] === 0 ? 0 : Math.max(2, (counts[s] / barMax) * 100);
                                return (
                                    <div key={s} className="an-bar-row">
                                        <span className="an-bar-label">{label}</span>
                                        <div className="an-bar-track">
                                            <div
                                                className="an-bar-fill"
                                                style={{ width: `${pct}%`, background: color }}
                                                role="progressbar"
                                                aria-valuenow={counts[s]}
                                                aria-valuemax={barMax}
                                                aria-label={label}
                                            />
                                        </div>
                                        <span className="an-bar-count" style={{ color }}>{counts[s]}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* recent activity */}
                    <section className="an-section">
                        <h3 className="an-section-heading">Recent Activity</h3>
                        {recent.length === 0 ? (
                            <p className="an-meta">No jobs yet.</p>
                        ) : (
                            <table className="an-table">
                                <thead>
                                <tr>
                                    {["Company", "Role", "Status", "Date Applied"].map(h => (
                                        <th key={h} className="an-th">{h}</th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {recent.map(job => {
                                    const meta = STATUS_META[job.status?.toLowerCase()];
                                    return (
                                        <tr key={job.id} className="an-tr">
                                            <td className="an-td">{job.company}</td>
                                            <td className="an-td">{job.role}</td>
                                            <td className="an-td">
                          <span
                              className="an-badge"
                              style={{
                                  color:       meta?.color ?? "#64748b",
                                  background:  meta?.light ?? "#f1f5f9",
                                  borderColor: `${meta?.color ?? "#64748b"}22`,
                              }}
                          >
                            {job.status}
                          </span>
                                            </td>
                                            <td className="an-td an-td--mono">{job.date_applied}</td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}