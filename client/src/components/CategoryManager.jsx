import { useState } from 'react';

export default function CategoryManager({
  categories,
  busy,
  error,
  onCreate,
  onRename,
  onDelete,
}) {
  const [expanded, setExpanded] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingName, setEditingName] = useState(null);
  const [renamedValue, setRenamedValue] = useState('');

  async function submitNewCategory(event) {
    event.preventDefault();
    if (await onCreate(newName)) {
      setNewName('');
    }
  }

  async function submitRename(event) {
    event.preventDefault();
    if (await onRename(editingName, renamedValue)) {
      setEditingName(null);
      setRenamedValue('');
    }
  }

  function beginRename(name) {
    setEditingName(name);
    setRenamedValue(name);
  }

  return (
    <section className="panel category-panel" aria-labelledby="categories-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">ORGANIZATION</p>
          <h2 id="categories-heading">Categories</h2>
        </div>
        <button
          className="category-toggle"
          type="button"
          aria-expanded={expanded}
          aria-controls="category-management"
          onClick={() => setExpanded((previous) => !previous)}
        >
          <span>{expanded ? 'Hide' : 'Manage'}</span>
          <span className="transaction-count">{categories.length} total</span>
          <span className="category-toggle-icon" aria-hidden="true">{expanded ? '⌃' : '⌄'}</span>
        </button>
      </div>

      <div id="category-management" hidden={!expanded}>
        <form className="category-create-form" onSubmit={submitNewCategory}>
          <label className="category-create-field">
            <span className="sr-only">New category name</span>
            <input
              required
              maxLength="60"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Add a category"
            />
          </label>
          <button className="secondary-button" type="submit" disabled={busy}>Add category</button>
        </form>

        {error && <div className="alert error-alert" role="alert">{error}</div>}

        {categories.length === 0 ? (
          <p className="category-empty">No categories yet. Add one to start recording transactions.</p>
        ) : (
          <ul className="category-items">
            {categories.map((category) => (
              <li className="category-item" key={category}>
                {editingName === category ? (
                  <form className="category-rename-form" onSubmit={submitRename}>
                    <label className="sr-only" htmlFor="renamed-category">Category name</label>
                    <input
                      id="renamed-category"
                      required
                      maxLength="60"
                      value={renamedValue}
                      onChange={(event) => setRenamedValue(event.target.value)}
                      autoFocus
                    />
                    <button className="icon-button" type="submit" disabled={busy}>Save</button>
                    <button
                      className="icon-button"
                      type="button"
                      disabled={busy}
                      onClick={() => setEditingName(null)}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <span>{category}</span>
                    <div className="category-actions">
                      <button
                        className="icon-button"
                        type="button"
                        disabled={busy}
                        onClick={() => beginRename(category)}
                        aria-label={`Rename ${category}`}
                      >
                        Rename
                      </button>
                      <button
                        className="icon-button delete-button"
                        type="button"
                        disabled={busy}
                        onClick={() => onDelete(category)}
                        aria-label={`Delete ${category}`}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
