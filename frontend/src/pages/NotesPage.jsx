import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Fuse from "fuse.js";

import SiteHeader from "../components/SiteHeader.jsx";

import CreateNoteForm from "../components/notes/CreateNoteForm.jsx";
import SearchPanel from "../components/notes/SearchPanel.jsx";

import CollaboratorPanel from "../components/notes/CollaboratorPanel.jsx";

import api from "../services/api.js";
import NoteList from "../components/notes/NoteList.jsx";

const initialFormState = {
  title: "",
  content: "",
  tags: "",
};

export default function NotesPage() {
  const [searchParams] = useSearchParams();

  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");

  const [loadingNotes, setLoadingNotes] = useState(true);

  const [status, setStatus] = useState({
    loading: false,
    error: "",
    success: "",
  });

  const activeMode =
    searchParams.get("mode") || "notes";

  const sortedNotes = useMemo(() => {
    const term = appliedSearchTerm.trim();

    if (!term) return notes;

    const fuse = new Fuse(notes, {
      keys: [
        "title",
        "content",
        "tags",
        {
          name: "collaborators.name",
          weight: 0.5,
        },
        {
          name: "collaborators.email",
          weight: 0.5,
        },
      ],
      threshold: 0.4,
      ignoreLocation: true,
    });

    const results = fuse.search(term);
    return results.map((r) => r.item);
  }, [notes, appliedSearchTerm]);

  const collaboratorSummary = useMemo(() => {
    const collaborators = new Map();

    notes.forEach((note) => {
      note.collaborators?.forEach(
        (collaborator) => {
          const id =
            collaborator._id ||
            collaborator;

          if (!collaborators.has(id)) {
            collaborators.set(
              id,
              collaborator
            );
          }
        }
      );
    });

    return Array.from(
      collaborators.values()
    );
  }, [notes]);

  const loadNotes = async () => {
    setLoadingNotes(true);

    try {
      const { data } =
        await api.get("/api/notes");

      setNotes(data);
    } catch (error) {
      setStatus({
        loading: false,
        error:
          error.response?.data?.message ||
          "Failed to load notes",
        success: "",
      });
    } finally {
      setLoadingNotes(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setStatus({
      loading: true,
      error: "",
      success: "",
    });

    try {
      await api.post(
        "/api/notes",
        formData
      );

      setFormData(initialFormState);

      setStatus({
        loading: false,
        error: "",
        success:
          "Note created successfully",
      });

      await loadNotes();
    } catch (error) {
      setStatus({
        loading: false,
        error:
          error.response?.data?.message ||
          "Failed to create note",
        success: "",
      });
    }
  };

  const handleDelete = async (
    noteId
  ) => {
    try {
      await api.delete(
        `/api/notes/${noteId}`
      );

      await loadNotes();
    } catch (error) {
      setStatus({
        loading: false,
        error:
          error.response?.data?.message ||
          "Failed to delete note",
        success: "",
      });
    }
  };

  return (
    <main className="app-shell site-page">
      <SiteHeader />

      <section className="hero-banner compact-hero">
        <div>
          <span className="eyebrow">
            Notes workspace
          </span>

          <h1>
            Manage notes in one place.
          </h1>

          <p>
            Search, create, and review
            notes without clutter.
          </p>
        </div>
      </section>

      <section className="workspace-layout">
        <div className="main-panel surface-panel">

          <div className="mode-tabs">
            <Link
              className={`mode-tab ${
                activeMode === "notes"
                  ? " active"
                  : ""
              }`}
              to="/notes"
            >
              Notes
            </Link>

            <Link
              className={`mode-tab ${
                activeMode === "search"
                  ? " active"
                  : ""
              }`}
              to="/notes?mode=search"
            >
              Search
            </Link>

            <Link
              className={`mode-tab ${
                activeMode ===
                "collaborators"
                  ? " active"
                  : ""
              }`}
              to="/notes?mode=collaborators"
            >
              Collaborators
            </Link>
          </div>

          {activeMode === "search" && (
            <SearchPanel
              searchTerm={searchTerm}
              handleSearchChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
              handleSearchSubmit={() =>
                setAppliedSearchTerm(
                  searchTerm
                )
              }
            />
          )}

          {activeMode === "notes" && (
            <CreateNoteForm
              formData={formData}
              setFormData={
                setFormData
              }
              handleChange={
                handleChange
              }
              handleSubmit={
                handleSubmit
              }
              status={status}
            />
          )}

          <section className="section-card">
            <h2>Note List</h2>

            <NoteList
              notes={sortedNotes}
              loadingNotes={
                loadingNotes
              }
              handleDelete={
                handleDelete
              }
            />
          </section>

          {activeMode ===
            "collaborators" && (
            <CollaboratorPanel
              collaboratorSummary={
                collaboratorSummary
              }
            />
          )}
        </div>
      </section>
    </main>
  );
}