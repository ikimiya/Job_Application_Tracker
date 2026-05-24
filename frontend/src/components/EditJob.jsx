import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./JobForm.css";

const API = "http://localhost:8000";

const STATUSES = ["applied", "interview", "offer", "rejected", "ghosted"];

const isValidWebsite = (url) => {
    if (!url) return true; // optional field
    return /^(https?:\/\/)?(www\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+/.test(url);
};

export default function EditJob() {
    const { id }       = useParams();
    const navigate     = useNavigate();

    const [fields, setFields]             = useState(null);   // null = not yet loaded
    const [loadError, setLoadError]       = useState(null);
    const [notFound, setNotFound]         = useState(false);
    const [websiteError, setWebsiteError] = useState("");
    const [submitError, setSubmitError]   = useState("");
    const [submitting, setSubmitting]     = useState(false);

    useEffect(() => {
        fetch(`${API}/jobs/${id}`)
            .then(res => {
                if (res.status === 404) { setNotFound(true); return null; }
                if (!res.ok) throw new Error(`Server responded ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (!data) return;
                // normalise nulls to empty strings so controlled inputs never go uncontrolled
                setFields({
                    company:         data.company         ?? "",
                    role:            data.role             ?? "",
                    date_applied:    data.date_applied     ?? "",
                    status:          data.status           ?? "applied",
                    website:         data.website          ?? "",
                    job_description: data.job_description  ?? "",
                    notes:           data.notes            ?? "",
                });
            })
            .catch(e => setLoadError(e.message));
    }, [id]);

    function handleChange(e) {
        const { name, value } = e.target;
        setFields(prev => ({ ...prev, [name]: value }));
        if (name === "website") setWebsiteError("");
    }

    function validateWebsite() {
        if (fields.website && !isValidWebsite(fields.website)) {
            setWebsiteError("Enter a valid URL (e.g. https://careers.google.com or www.google.com)");
            return false;
        }
        return true;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitError("");

        if (!validateWebsite()) return;

        // only send fields with actual values; empty optionals become absent
        const body = {
            company:      fields.company,
            role:         fields.role,
            date_applied: fields.date_applied,
            status:       fields.status,
            // send null explicitly to clear a previously-set optional field
            website:         fields.website         || null,
            job_description: fields.job_description || null,
            notes:           fields.notes           || null,
        };

        setSubmitting(true);
        try {
            const res = await fetch(`${API}/jobs/${id}`, {
                method:  "PUT",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify(body),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                const detail = data?.detail?.[0]?.msg ?? data?.detail ?? "Request failed";
                throw new Error(detail);
            }

            navigate("/");
        } catch (err) {
            setSubmitError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    if (notFound) return (
        <div className="jf-form">
            <h2 className="jf-heading">Job not found</h2>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: 20 }}>
                No job with id {id} exists.
            </p>
            <button className="jf-submit" onClick={() => navigate("/")}>Back to Applications</button>
        </div>
    );

    if (loadError) return (
        <div className="jf-form">
            <h2 className="jf-heading">Error loading job</h2>
            <p className="jf-submit-error">{loadError}</p>
        </div>
    );

    if (!fields) return (
        <div className="jf-form">
            <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Loading…</p>
        </div>
    );

    return (
        <form className="jf-form" onSubmit={handleSubmit} noValidate>
            <h2 className="jf-heading">Edit Application</h2>

            <div className="jf-row jf-row--2col">
                <div className="jf-field">
                    <label className="jf-label" htmlFor="company">Company <span className="jf-required">*</span></label>
                    <input
                        id="company" name="company" className="jf-input"
                        value={fields.company} onChange={handleChange}
                        placeholder="Acme Corp" required
                    />
                </div>
                <div className="jf-field">
                    <label className="jf-label" htmlFor="role">Role <span className="jf-required">*</span></label>
                    <input
                        id="role" name="role" className="jf-input"
                        value={fields.role} onChange={handleChange}
                        placeholder="Software Engineer" required
                    />
                </div>
            </div>

            <div className="jf-row jf-row--2col">
                <div className="jf-field">
                    <label className="jf-label" htmlFor="date_applied">Date Applied <span className="jf-required">*</span></label>
                    <input
                        id="date_applied"
                        type="date"
                        name="date_applied"
                        className="jf-input jf-input--mono"
                        value={fields.date_applied}
                        onChange={handleChange}
                        placeholder="YYYY-MM-DD"
                        required
                    />
                </div>

                <div className="jf-field">
                    <label className="jf-label" htmlFor="status">Status</label>
                    <select
                        id="status" name="status" className="jf-select"
                        value={fields.status} onChange={handleChange}
                    >
                        {STATUSES.map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="jf-field">
                <label className="jf-label" htmlFor="website">Website</label>
                <input
                    id="website" name="website"
                    className={`jf-input${websiteError ? " jf-input--error" : ""}`}
                    value={fields.website} onChange={handleChange} onBlur={validateWebsite}
                    placeholder="https://careers.example.com"
                />
                {websiteError && <span className="jf-field-error">{websiteError}</span>}
            </div>

            <div className="jf-field">
                <label className="jf-label" htmlFor="job_description">Description</label>
                <textarea
                    id="job_description" name="job_description" className="jf-textarea"
                    value={fields.job_description} onChange={handleChange}
                    placeholder="Paste the job description…" rows={4}
                />
            </div>

            <div className="jf-field">
                <label className="jf-label" htmlFor="notes">Notes</label>
                <textarea
                    id="notes" name="notes" className="jf-textarea"
                    value={fields.notes} onChange={handleChange}
                    placeholder="Referral, recruiter name, next steps…" rows={3}
                />
            </div>

            {submitError && <p className="jf-submit-error">{submitError}</p>}

            <div className="jf-footer">
                <button
                    type="button" className="jf-submit"
                    style={{ background: "none", color: "#64748b", border: "1px solid #cbd5e1", marginRight: 10 }}
                    onClick={() => navigate("/")}
                >
                    Cancel
                </button>
                <button type="submit" className="jf-submit" disabled={submitting}>
                    {submitting ? "Saving…" : "Save Changes"}
                </button>
            </div>
        </form>
    );
}