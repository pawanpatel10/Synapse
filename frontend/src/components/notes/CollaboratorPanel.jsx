export default function CollaboratorPanel({
  collaboratorSummary,
}) {
  return (
    <section className="section-card">
      <h2>Collaborators</h2>

      {collaboratorSummary.length > 0 ? (
        <div className="note-list">
          {collaboratorSummary.map((collaborator) => (
            <div
              className="note-item"
              key={
                collaborator._id ||
                collaborator.email
              }
            >
              <strong>
                {collaborator.name ||
                  "Unnamed collaborator"}
              </strong>

              <p>
                {collaborator.email ||
                  "No email available"}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p>No collaborators added yet.</p>
      )}
    </section>
  );
}