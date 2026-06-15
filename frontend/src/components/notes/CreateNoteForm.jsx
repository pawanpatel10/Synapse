import NoteEditor from "./NoteEditor";

export default function CreateNoteForm({
  formData,
  handleChange,
  setFormData,
  handleSubmit,
  status,
}) {
  return (
    <section className="section-card create-note-card">
      <h2>Create note</h2>

      <form className="field-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Title</span>

          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </label>

        <label className="field">
          <span>Content</span>

          <NoteEditor
            value={formData.content}
            onChange={(content) =>
              setFormData((prev) => ({
                ...prev,
                content,
              }))
            }
          />
        </label>

        <label className="field">
          <span>Tags</span>

          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
          />
        </label>

        <label className="field">
          <span>Collaborators</span>

          <input
            type="text"
            name="collaborators"
            value={formData.collaborators || ""}
            onChange={handleChange}
          />
        </label>

        <button
          className="primary-button"
          type="submit"
          disabled={status.loading}
        >
          {status.loading ? "Saving..." : "Create note"}
        </button>
      </form>

      {status.error && (
        <div className="error-banner">{status.error}</div>
      )}

      {status.success && (
        <div className="success-banner">{status.success}</div>
      )}
    </section>
  );
}