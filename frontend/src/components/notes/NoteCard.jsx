import { Link } from "react-router-dom";

export default function NoteCard({ note, handleDelete, compact }) {
  if (compact) {
    return (
      <div className="note-item">
        <Link className="secondary-button button-link" to={`/notes/${note._id}/edit`}>{note.title}</Link>
      </div>
    );
  }

  return (
    <div className="note-item">
      <div className="note-header">
        <strong>{note.title}</strong>
        <div className="button-row">
          <Link className="secondary-button button-link" to={`/notes/${note._id}/edit`}>Edit</Link>
          <button className="secondary-button" onClick={() => handleDelete(note._id)}>Delete</button>
        </div>
      </div>
      <div dangerouslySetInnerHTML={{ __html: note.content || "" }} />
      <p className="note-meta">
        {note.tags?.length
          ? note.tags.map((tag) => `#${tag}`).join(" ")
          : "No tags yet"}
      </p>
      {note.collaborators?.length ? (
        <p className="note-meta">
          Collaborators: {note.collaborators
            .map((collaborator) => collaborator.name || collaborator.email || "User")
            .join(", ")}
        </p>
      ) : null}
    </div>
  );
}