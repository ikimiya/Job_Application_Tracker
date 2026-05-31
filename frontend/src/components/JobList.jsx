import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./JobList.css";
import API from "../config.js";


const TABS = ["All", "Applied", "Interview", "Offer", "Rejected", "Ghosted"];

const STATUSES = ["applied", "interview", "offer", "rejected", "ghosted"];

const STATUS_STYLES = {
    applied:   { color: "#2563eb", background: "#eff6ff", stripe: "#2563eb" },
    interview: { color: "#7c3aed", background: "#f5f3ff", stripe: "#7c3aed" },
    offer:     { color: "#16a34a", background: "#f0fdf4", stripe: "#16a34a" },
    rejected:  { color: "#dc2626", background: "#fef2f2", stripe: "#dc2626" },
    ghosted:   { color: "#78716c", background: "#fafaf9", stripe: "#a8a29e" },
};

const STATUS_DEFAULT = { color: "#64748b", background: "#f1f5f9", stripe: "#94a3b8" };

const TAB_COLORS = {
    All:       { active: "#0f172a", badge: "#f1f5f9", badgeText: "#475569" },
    Applied:   { active: "#2563eb", badge: "#eff6ff", badgeText: "#2563eb" },
    Interview: { active: "#7c3aed", badge: "#f5f3ff", badgeText: "#7c3aed" },
    Offer:     { active: "#16a34a", badge: "#f0fdf4", badgeText: "#16a34a" },
    Rejected:  { active: "#dc2626", badge: "#fef2f2", badgeText: "#dc2626" },
    Ghosted:   { active: "#78716c", badge: "#fafaf9", badgeText: "#78716c" },
};

function JobRow({ job, onDelete, onStatusChange }) {
    const navigate = useNavigate();
    const [expanded, setExpanded]     = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [deleting, setDeleting]     = useState(false);
    const [updating, setUpdating]     = useState(false);
    const [rowError, setRowError]     = useState(null);

    const hasExpandable = job.job_description || job.notes;
    const stripe = (STATUS_STYLES[job.status?.toLowerCase()] ?? STATUS_DEFAULT).stripe;

    async function handleDelete() {
        setDeleting(true);
        setRowError(null);
        try {
            const res = await fetch(`${API}/jobs/${job.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error(`Server responded ${res.status}`);
            onDelete(job.id);
        } catch {
            setRowError("Delete failed");
            setDeleting(false);
        }
    }

    async function handleStatusChange(e) {
        const newStatus = e.target.value;
        setUpdating(true);
        setRowError(null);

        // optimistically update local state so the row moves tabs instantly
        onStatusChange(job.id, newStatus);

        try {
            const res = await fetch(`${API}/jobs/${job.id}`, {
                method:  "PUT",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error(`Server responded ${res.status}`);
        } catch {
            // roll back to original status if the request failed
            onStatusChange(job.id, job.status);
            setRowError("Update failed");
        } finally {
            setUpdating(false);
        }
    }

    return (
        <>
            <tr className="jl-row" style={{ borderLeftColor: stripe }}>
                <td className="jl-td">{job.company}</td>
                <td className="jl-td">{job.role}</td>
                <td className="jl-td">
                    <select
                        className="jl-status-select"
                        value={job.status}
                        onChange={handleStatusChange}
                        disabled={updating}
                        aria-label="Update status"
                    >
                        {STATUSES.map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                    </select>
                </td>
                <td className="jl-td jl-td--mono">{job.date_applied}</td>
                <td className="jl-td">
                    {job.website
                        ? <a href={job.website} target="_blank" rel="noreferrer" className="jl-link">
                            {job.website.replace(/^https?:\/\//, "").split("/")[0]}
                        </a>
                        : <span className="jl-empty">—</span>}
                </td>
                <td className="jl-td jl-td--icon">
                    {/* only render when there's something to show */}
                    {hasExpandable && (
                        <button
                            onClick={() => setExpanded(x => !x)}
                            className="jl-icon-btn"
                            aria-label={expanded ? "Collapse row" : "Expand row"}
                        >
                            {expanded ? "▲" : "▼"}
                        </button>
                    )}
                </td>
                <td className="jl-td jl-td--actions">
                    <button onClick={() => navigate(`/edit/${job.id}`)} className="jl-edit-btn">
                        Edit
                    </button>
                    <button
                        onClick={() => setConfirmingDelete(true)}
                        disabled={deleting}
                        className={`jl-delete-btn${deleting ? " jl-delete-btn--deleting" : ""}`}
                    >
                        {deleting ? "…" : "Delete"}
                    </button>
                    {rowError && <span className="jl-row-error">{rowError}</span>}
                </td>
            </tr>

            {/* modal renders outside table flow to avoid tr/td nesting constraints */}
            {confirmingDelete && (
                <tr>
                    <td colSpan={7} style={{padding: "12px 24px", background: "transparent"}}>
                        <div className="jl-confirm-block">
            <span className="jl-confirm-msg">
                Delete <strong>{job.company}</strong> — {job.role}? This cannot be undone.
            </span>
                            <div style={{display: "flex", gap: "10px"}}>
                                <button className="jl-confirm-yes" onClick={handleDelete} disabled={deleting}>
                                    {deleting ? "Deleting…" : "Yes, delete"}
                                </button>
                                <button className="jl-confirm-no" onClick={() => setConfirmingDelete(false)}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </td>
                </tr>
            )}

            {/* expanded detail row — keeps optional fields out of the scannable main row */}
            {expanded && (
                <tr className="jl-detail-row" style={{ borderLeftColor: stripe }}>
                    <td colSpan={7} className="jl-detail-cell">
                        {job.job_description && (
                            <div className={job.notes ? "jl-detail-block jl-detail-block--gap" : "jl-detail-block"}>
                                <span className="jl-detail-label">Description</span>
                                <p className="jl-detail-text">{job.job_description}</p>
                            </div>
                        )}
                        {job.notes && (
                            <div className="jl-detail-block">
                                <span className="jl-detail-label">Notes</span>
                                <p className="jl-detail-text">{job.notes}</p>
                            </div>
                        )}
                    </td>
                </tr>
            )}
        </>
    );
}

export default function JobList({ refreshKey }) {
    const [jobs, setJobs]           = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);
    const [activeTab, setActiveTab] = useState("All");
    const [sort, setSort]           = useState({ col: null, dir: "asc" });

    useEffect(() => {
        fetch(`${API}/jobs`)
            .then(res => {
                if (!res.ok) throw new Error(`Server responded ${res.status}`);
                return res.json();
            })
            .then(data => { setJobs(data); setLoading(false); })
            .catch(e  => { setError(e.message); setLoading(false); });
    }, [refreshKey]);

    function handleDelete(id) {
        setJobs(prev => prev.filter(j => j.id !== id));
    }

    // update a single job's status in local state so the row re-renders
    // and moves to the correct tab without a refetch
    function handleStatusChange(id, newStatus) {
        setJobs(prev => prev.map(j => j.id === id ? { ...j, status: newStatus } : j));
    }

    function handleSort(col) {
        setSort(prev =>
            prev.col === col
                ? { col, dir: prev.dir === "asc" ? "desc" : "asc" }  // flip direction on same column
                : { col, dir: "asc" }                                  // new column always starts ascending
        );
    }

    const counts = TABS.reduce((acc, tab) => {
        acc[tab] = tab === "All"
            ? jobs.length
            : jobs.filter(j => j.status?.toLowerCase() === tab.toLowerCase()).length;
        return acc;
    }, {});

    const filtered = activeTab === "All"
        ? jobs
        : jobs.filter(j => j.status?.toLowerCase() === activeTab.toLowerCase());

    const SORT_KEY = {
        Company:      j => j.company?.toLowerCase()      ?? "",
        Role:         j => j.role?.toLowerCase()          ?? "",
        Status:       j => j.status?.toLowerCase()        ?? "",
        "Date Applied": j => j.date_applied               ?? "",
    };

    const sorted = sort.col
        ? [...filtered].sort((a, b) => {
            const fn  = SORT_KEY[sort.col];
            const cmp = fn(a) < fn(b) ? -1 : fn(a) > fn(b) ? 1 : 0;
            return sort.dir === "asc" ? cmp : -cmp;
        })
        : filtered;

    return (
        <div className="jl-wrapper">
            <div className="jl-header">
                <h2 className="jl-heading">Applications</h2>
                <span className="jl-count">{jobs.length} total</span>
            </div>

            {loading && <p className="jl-meta">Loading…</p>}
            {error   && <p className="jl-meta jl-meta--error">Failed to load jobs: {error}</p>}

            {!loading && !error && (
                <>
                    <div className="jl-tabs" role="tablist">
                        {TABS.map(tab => {
                            const isActive = tab === activeTab;
                            const colors   = TAB_COLORS[tab];
                            return (
                                <button
                                    key={tab}
                                    role="tab"
                                    aria-selected={isActive}
                                    onClick={() => setActiveTab(tab)}
                                    className={`jl-tab${isActive ? " jl-tab--active" : ""}`}
                                    // only the active underline colour is data-driven
                                    style={isActive ? { borderBottomColor: colors.active, color: colors.active } : {}}
                                >
                                    {tab}
                                    <span
                                        className="jl-tab-badge"
                                        style={{ background: colors.badge, color: colors.badgeText }}
                                    >
                    {counts[tab]}
                  </span>
                                </button>
                            );
                        })}
                    </div>

                    {filtered.length === 0 ? (
                        <p className="jl-meta">No jobs found.</p>
                    ) : (
                        <div className="jl-scroll">
                            <table className="jl-table">
                                <thead>
                                <tr>
                                    {["Company", "Role", "Status", "Date Applied", "Website", "", ""].map((h, i) => {
                                        const sortable = h in SORT_KEY;
                                        const isActive = sort.col === h;
                                        return (
                                            <th
                                                key={i}
                                                className={`jl-th${sortable ? " jl-th--sortable" : ""}${isActive ? " jl-th--active" : ""}`}
                                                onClick={sortable ? () => handleSort(h) : undefined}
                                                aria-sort={isActive ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                                            >
                                                {h}
                                                {sortable && (
                                                    <span className="jl-sort-arrow">
                              {isActive ? (sort.dir === "asc" ? " ↑" : " ↓") : " ↕"}
                            </span>
                                                )}
                                            </th>
                                        );
                                    })}
                                </tr>
                                </thead>
                                <tbody>
                                {sorted.map(job => (
                                    <JobRow
                                        key={job.id}
                                        job={job}
                                        onDelete={handleDelete}
                                        onStatusChange={handleStatusChange}
                                    />
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}