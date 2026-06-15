export default function SearchPanel({
  searchTerm,
  handleSearchChange,
  handleSearchSubmit,
}) {
  return (
    <section className="section-card">
      <h2>Search notes</h2>

      <div className="search-panel">
        <label className="field">
          <span>
            Search by title, content, tag, or collaborator
          </span>

          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Type a name or keyword"
          />
        </label>

        <button
          className="primary-button search-button"
          type="button"
          onClick={handleSearchSubmit}
        >
          Search
        </button>
      </div>
    </section>
  );
}