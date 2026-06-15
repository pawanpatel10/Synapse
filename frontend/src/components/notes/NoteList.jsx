import { Link } from "react-router-dom";
import NoteCard from "./NoteCard";

export default function NoteList({ notes, loadingNotes, handleDelete, compact = false }) {
  if (loadingNotes) return <p>Loading notes...</p>;
  if (!notes.length) return <p>No notes created yet.</p>;
  return (
    <div className="note-list">
      {notes.map((note) => (
        <div key={note._id} className="note-item flex justify-between text-red-500">
          <Link to={`/notes/${note._id}/edit`} className="secondary-button button-link">
            {note.title || "Untitled"}
          </Link>
          <button className="secondary-button" onClick={() => handleDelete(note._id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}