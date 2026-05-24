import { useState } from "react";
import "./JobForm.css";

const API = "http://localhost:8000";

const STATUSES = ["applied", "interview", "offer", "rejected", "ghosted"];

const EMPTY_FORM = {
    company:         "",
    role:            "",
    date_applied:    "",
    status:          "applied",
    website:         "",
    job_description: "",
    notes:           "",
};

// mirrors the backend regex so the user gets feedback before a round-trip
const isValidWebsite = (url) => {
    if (!url) return true; // optional field
    return /^(https?:\/\/)?(www\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+/.test(url);
};

export default function JobForm({ onJobAdded }) {
    const [fields, setFields]         = useState(EMPTY_FORM);
    const [websiteError, setWebsiteError] = useState("");
    const [submitError, setSubmitError]   = useState("");
    const [submitting, setSubmitting]     = useState(false);

    function handleChange(e) {
        const { name, value } = e.target;
        setFields(prev => ({ ...prev, [name]: value }));

        // clear the website error as soon as the user starts correcting it
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

        // strip optional fields that are empty strings so the backend
        // receives null-equivalent absence rather than blank strings
        const body = {
            company:      fields.company,
            role:         fields.role,
            date_applied: fields.date_applied,
            status:       fields.status,
            ...(fields.website         && { website:         fields.website }),
            ...(fields.job_description && { job_description: fields.job_description }),
            ...(fields.notes           && { notes:           fields.notes }),
        };

        setSubmitting(true);
        try {
            const res = await fetch(`${API}/jobs`, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify(body),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                // surface the first pydantic validation message if present
                const detail = data?.detail?.[0]?.msg ?? data?.detail ?? "Request failed";
                throw new Error(detail);
            }

            setFields(EMPTY_FORM);
            onJobAdded();
        } catch (err) {
            setSubmitError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form className="jf-form" onSubmit={handleSubmit} noValidate>
            <h2 className="jf-heading">Add Application</h2>

            <div className="jf-row jf-row--2col">
                <div className="jf-field">
                    <label className="jf-label" htmlFor="company">Company <span className="jf-required">*</span></label>
                    <input
                        id="company"
                        name="company"
                        className="jf-input"
                        value={fields.company}
                        onChange={handleChange}
                        placeholder="Acme Corp"
                        required
                    />
                </div>

                <div className="jf-field">
                    <label className="jf-label" htmlFor="role">Role <span className="jf-required">*</span></label>
                    <input
                        id="role"
                        name="role"
                        className="jf-input"
                        value={fields.role}
                        onChange={handleChange}
                        placeholder="Software Engineer"
                        required
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
                        id="status"
                        name="status"
                        className="jf-select"
                        value={fields.status}
                        onChange={handleChange}
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
                    id="website"
                    name="website"
                    className={`jf-input${websiteError ? " jf-input--error" : ""}`}
                    value={fields.website}
                    onChange={handleChange}
                    onBlur={validateWebsite}
                    placeholder="https://careers.example.com"
                />
                {websiteError && <span className="jf-field-error">{websiteError}</span>}
            </div>

            <div className="jf-field">
                <label className="jf-label" htmlFor="job_description">Description</label>
                <textarea
                    id="job_description"
                    name="job_description"
                    className="jf-textarea"
                    value={fields.job_description}
                    onChange={handleChange}
                    placeholder="Paste the job description…"
                    rows={4}
                />
            </div>

            <div className="jf-field">
                <label className="jf-label" htmlFor="notes">Notes</label>
                <textarea
                    id="notes"
                    name="notes"
                    className="jf-textarea"
                    value={fields.notes}
                    onChange={handleChange}
                    placeholder="Referral, recruiter name, next steps…"
                    rows={3}
                />
            </div>

            {submitError && (
                <p className="jf-submit-error">{submitError}</p>
            )}

            <div className="jf-footer">
                <button type="submit" className="jf-submit" disabled={submitting}>
                    {submitting ? "Adding…" : "Add Application"}
                </button>
            </div>
        </form>
    );
}