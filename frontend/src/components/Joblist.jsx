import { useState, useEffect } from "react";
import "./JobList.css";

const API = "http://localhost:8000";

const STATUS_STYLES = {
  applied:   { color: "#2563eb", background: "#eff6ff", stripe: "#2563eb" },
  interview: { color: "#7c3aed", background: "#f5f3ff", stripe: "#7c3aed" },
  offer:     { color: "#16a34a", background: "#f0fdf4", stripe: "#16a34a" },
  rejected:  { color: "#dc2626", background: "#fef2f2", stripe: "#dc2626" },
  ghosted:   { color: "#78716c", background: "#fafaf9", stripe: "#a8a29e" },
};

const STATUS_DEFAULT = { color: "#64748b", background: "#f1f5f9", stripe: "#94a3b8" };

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status?.toLowerCase()] ?? STATUS_DEFAULT;
  // inline only for the values that are data-driven and can't live in CSS
  return (
    <span
      className="jl-badge"
      style={{ color: s.color, background: s.background, borderColor: `${s.color}22` }}
    >
      {status}
    </span>
  );
}

function JobRow({ job, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState(null);

  const hasExpandable = job.job_description || job.notes;
  const stripe = (STATUS_STYLES[job.status?.toLowerCase()] ?? STATUS_DEFAULT).stripe;

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${API}/jobs/${job.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      onDelete(job.id);
    } catch {
      setError("Delete failed");
      setDeleting(false);
    }
  }

  return (
    <>
      <tr className="jl-row" style={{ borderLeftColor: stripe }}>
        <td className="jl-td">{job.company}</td>
        <td className="jl-td">{job.role}</td>
        <td className="jl-td"><StatusBadge status={job.status} /></td>
        <td className="jl-td jl-td--mono">{job.date_applied}</td>
        <td className="jl-td">
          {job.website
            ? <a href={job.website} target="_blank" rel="noreferrer" className="jl-link">
                {new URL(job.website).hostname}
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
        <td className="jl-td jl-td--action">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`jl-delete-btn${deleting ? " jl-delete-btn--deleting" : ""}`}
          >
            {deleting ? "…" : "Delete"}
          </button>
          {error && <span className="jl-row-error">{error}</span>}
        </td>
      </tr>

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

export default function JobList() {
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

  // filter locally so we don't need a refetch and don't reset expanded rows
  function handleDelete(id) {
    setJobs(prev => prev.filter(j => j.id !== id));
  }

  return (
    <div className="jl-wrapper">
      <div className="jl-header">
        <h2 className="jl-heading">Applications</h2>
        <span className="jl-count">{jobs.length} total</span>
      </div>

      {loading && <p className="jl-meta">Loading…</p>}
      {error   && <p className="jl-meta jl-meta--error">Failed to load jobs: {error}</p>}

      {!loading && !error && jobs.length === 0 && (
        <p className="jl-meta">No jobs found.</p>
      )}

      {!loading && !error && jobs.length > 0 && (
        <div className="jl-scroll">
          <table className="jl-table">
            <thead>
              <tr>
                {["Company", "Role", "Status", "Date Applied", "Website", "", ""].map((h, i) => (
                  <th key={i} className="jl-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <JobRow key={job.id} job={job} onDelete={handleDelete} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
