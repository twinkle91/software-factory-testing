"use client";

import { useEffect, useRef, useState } from "react";
import {
  type ActionItem,
  type Note,
  STATUSES,
  type Status,
  WORKSPACE_ID,
} from "@/lib/types";
import { ExportCsvButton } from "./ExportCsvButton";
import { Icon } from "./Icon";
import { NoteCard } from "./NoteCard";

async function responseData(response: Response) {
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

export function MemoFlow({
  initialNotes,
  initialItems,
}: {
  initialNotes: Note[];
  initialItems: ActionItem[];
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All statuses");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [composing, setComposing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [updating, setUpdating] = useState<string[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  const noteTitle = useRef<HTMLInputElement>(null);
  const query = search.trim().toLowerCase();
  const visibleNotes = notes.filter((note) =>
    `${note.title} ${note.body}`.toLowerCase().includes(query),
  );
  const visibleItems = items.filter(
    (item) =>
      `${item.title} ${item.owner}`.toLowerCase().includes(query) &&
      (filter === "All statuses" || item.status === filter),
  );

  useEffect(() => {
    if (composing) {
      dialog.current?.showModal();
      noteTitle.current?.focus();
    } else dialog.current?.close();
  }, [composing]);

  function toggleItem(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function saveItem(
    item: ActionItem,
    changes: Partial<Pick<ActionItem, "owner" | "status">>,
  ) {
    setUpdating((current) => [...current, item.id]);
    setError("");
    try {
      const data = await responseData(
        await fetch("/api/action-items", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...item,
            ...changes,
            currentWorkspaceId: WORKSPACE_ID,
          }),
        }),
      );
      setItems((current) =>
        current.map((entry) => (entry.id === item.id ? data.item : entry)),
      );
      setNotice("Action item saved.");
      return true;
    } catch (error) {
      setError((error as Error).message);
      return false;
    } finally {
      setUpdating((current) => current.filter((id) => id !== item.id));
    }
  }

  async function exportSelected() {
    setExporting(true);
    setError("");
    try {
      const response = await fetch("/api/export-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedIds: [...selected],
          currentWorkspaceId: WORKSPACE_ID,
        }),
      });
      if (!response.ok) await responseData(response);
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "memoflow-actions.csv";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice(`Exported ${selected.size} action items.`);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="app-shell">
      <a href="#overview" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar">
        <a className="brand" href="#overview">
          <span className="brand-mark">
            <Icon name="leaf" size={23} />
          </span>
          MemoFlow<span className="brand-period">.</span>
        </a>
        <div className="workspace">
          <span className="workspace-mark">A</span>
          <div>
            <strong>Team Alpha</strong>
            <span className="workspace-meta">Team workspace</span>
          </div>
          <span className="workspace-indicator">⌄</span>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Workspace">
          <a href="#overview" className="nav-link active">
            <Icon name="grid" size={18} />
            Overview
          </a>
          <a href="#notes" className="nav-link">
            <Icon name="note" size={18} />
            All notes<span className="nav-count">{notes.length}</span>
          </a>
          <a href="#actions" className="nav-link">
            <Icon name="tasks" size={18} />
            Action items<span className="nav-count">{items.length}</span>
          </a>
        </nav>
        <div className="sidebar-bottom">
          <div className="quiet-tip">
            <span className="tip-icon">
              <Icon name="leaf" size={18} />
            </span>
            <strong>A little less noise.</strong>
            <p>
              A little more headspace.
              <br />
              Make room for good work.
            </p>
          </div>
          <div className="profile">
            <span className="avatar">TA</span>
            <div>
              <strong>Team Alpha</strong>
              <span className="profile-meta">Demo workspace</span>
            </div>
            <span className="online-dot" title="Workspace ready" />
          </div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Workspace</span>
            <Icon name="chevron" size={12} />
            <strong>Overview</strong>
          </div>
          <span className="workspace-badge">
            <span />
            Team Alpha workspace
          </span>
        </header>
        <main id="overview">
          <div className="page-heading">
            <div>
              <p className="eyebrow">THINK CLEARLY. MOVE FORWARD.</p>
              <h1>
                Your team, on the same page
                <span className="brand-period">.</span>
              </h1>
              <p className="subtitle">
                A home for good ideas and the next steps that make them happen.
              </p>
            </div>
            <button
              className="button button-primary"
              type="button"
              onClick={() => {
                setError("");
                setComposing(true);
              }}
            >
              <Icon name="plus" size={17} />
              New note
            </button>
          </div>
          <div className="overview-cards">
            <div className="overview-card">
              <span className="stat-icon sage">
                <Icon name="note" size={20} />
              </span>
              <div>
                <span className="stat-value">
                  {notes.length.toString().padStart(2, "0")}
                </span>
                <span className="stat-label">Team notes</span>
              </div>
              <span className="stat-caption">Ideas, kept close</span>
            </div>
            <div className="overview-card">
              <span className="stat-icon blue">
                <Icon name="tasks" size={20} />
              </span>
              <div>
                <span className="stat-value">
                  {items.length.toString().padStart(2, "0")}
                </span>
                <span className="stat-label">Action items</span>
              </div>
              <span className="stat-caption">Small steps, big impact</span>
            </div>
            <div className="overview-card">
              <span className="stat-icon peach">
                <Icon name="check" size={20} />
              </span>
              <div>
                <span className="stat-value">
                  {items
                    .filter((item) => item.status === "Done")
                    .length.toString()
                    .padStart(2, "0")}
                </span>
                <span className="stat-label">Completed</span>
              </div>
              <span className="stat-caption">A little progress, every day</span>
            </div>
          </div>
          <div className="search-bar">
            <Icon name="search" size={18} />
            <input
              type="search"
              aria-label="Search notes and action items"
              placeholder="Find a note, an idea, a next step…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <span className="search-hint">Your thinking, organized</span>
          </div>
          {error && (
            <div className="error-banner" role="alert">
              {error}
              <button
                type="button"
                onClick={() => setError("")}
                aria-label="Dismiss error"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          )}
          <p className="sr-only" role="status">
            {notice}
          </p>
          <section id="notes" className="notes-section">
            <div className="section-heading">
              <div>
                <h2>
                  Team notes{" "}
                  <span className="section-count">{notes.length}</span>
                </h2>
                <p>Keep the context. Share the thinking.</p>
              </div>
              <button
                className="text-button"
                type="button"
                onClick={() => setComposing(true)}
              >
                Create a note
                <Icon name="plus" size={15} />
              </button>
            </div>
            <div className="notes-grid">
              {visibleNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
              {!query && (
                <button
                  className="new-note-card"
                  type="button"
                  onClick={() => setComposing(true)}
                >
                  <span>
                    <Icon name="plus" size={21} />
                  </span>
                  <strong>Start with a thought</strong>
                  <p>
                    A decision, an idea, a meeting takeaway.
                    <br />
                    Every good next step starts somewhere.
                  </p>
                </button>
              )}
              {visibleNotes.length === 0 && query && (
                <p className="empty-state">
                  No notes match “{search}”. Try another search.
                </p>
              )}
            </div>
          </section>
          <section id="actions" className="actions-section">
            <div className="section-heading">
              <div>
                <h2>
                  Action items{" "}
                  <span className="section-count">{items.length}</span>
                </h2>
                <p>Turn good conversations into forward motion.</p>
              </div>
              <ExportCsvButton
                count={selected.size}
                busy={exporting}
                onExport={() => void exportSelected()}
              />
            </div>
            <div className="action-panel">
              <div className="table-toolbar">
                <span>
                  <span className="small-dot" />
                  {selected.size > 0
                    ? `${selected.size} selected`
                    : "Your team's next steps"}
                </span>
                <label className="filter-control">
                  Status
                  <select
                    aria-label="Filter by status"
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                  >
                    <option>All statuses</option>
                    {STATUSES.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th className="checkbox-cell">
                        <input
                          type="checkbox"
                          aria-label="Select all visible action items"
                          checked={
                            visibleItems.length > 0 &&
                            visibleItems.every((item) => selected.has(item.id))
                          }
                          disabled={visibleItems.length === 0}
                          onChange={(event) =>
                            setSelected((current) => {
                              const next = new Set(current);
                              for (const item of visibleItems) {
                                if (event.target.checked) next.add(item.id);
                                else next.delete(item.id);
                              }
                              return next;
                            })
                          }
                        />
                      </th>
                      <th>Action item</th>
                      <th>Owner</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleItems.map((item) => (
                      <tr
                        key={item.id}
                        className={selected.has(item.id) ? "selected-row" : ""}
                      >
                        <td className="checkbox-cell">
                          <input
                            type="checkbox"
                            aria-label={`Select ${item.id}`}
                            checked={selected.has(item.id)}
                            onChange={() => toggleItem(item.id)}
                          />
                        </td>
                        <td className="item-title">
                          <span className="item-reference">
                            {item.id.replace("item-", "ACT-00")}
                          </span>
                          {item.title}
                        </td>
                        <td>
                          <div className="owner-control">
                            <span
                              className={`avatar avatar-small ${item.id === "item-2" ? "avatar-peach" : ""}`}
                            >
                              {item.owner
                                .split(" ")
                                .map((name) => name[0])
                                .join("")
                                .slice(0, 2)}
                            </span>
                            <input
                              key={item.owner}
                              aria-label={`Owner for ${item.id}`}
                              defaultValue={item.owner}
                              maxLength={100}
                              disabled={updating.includes(item.id)}
                              onBlur={(event) => {
                                const input = event.currentTarget;
                                if (input.value.trim() !== item.owner)
                                  void saveItem(item, {
                                    owner: input.value,
                                  }).then((saved) => {
                                    if (!saved) input.value = item.owner;
                                  });
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Enter")
                                  event.currentTarget.blur();
                              }}
                            />
                          </div>
                        </td>
                        <td>
                          <select
                            className={`status-select status-${item.status.toLowerCase().replaceAll(" ", "-")}`}
                            aria-label={`Status for ${item.id}`}
                            value={item.status}
                            disabled={updating.includes(item.id)}
                            onChange={(event) =>
                              void saveItem(item, {
                                status: event.target.value as Status,
                              })
                            }
                          >
                            {STATUSES.map((status) => (
                              <option key={status}>{status}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {visibleItems.length === 0 && (
                  <p className="empty-state">
                    No action items match these filters.
                  </p>
                )}
              </div>
              <div className="table-footer">
                <span>
                  {visibleItems.length} of {items.length} action items
                </span>
                <span>
                  Made for a little more follow-through
                  <Icon name="leaf" size={13} />
                </span>
              </div>
            </div>
          </section>
          <section id="feedback" className="feedback-section">
            <div className="feedback-copy">
              <span className="feedback-icon">
                <Icon name="message" size={21} />
              </span>
              <div>
                <h2>Good tools grow with you.</h2>
                <p>Something on your mind? Help shape what comes next.</p>
              </div>
            </div>
            <form
              className="feedback-form"
              onSubmit={async (event) => {
                event.preventDefault();
                setSendingFeedback(true);
                setError("");
                try {
                  await responseData(
                    await fetch("/api/feedback", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        message: feedback,
                        currentWorkspaceId: WORKSPACE_ID,
                      }),
                    }),
                  );
                  setFeedback("");
                  setFeedbackSent(true);
                } catch (error) {
                  setError((error as Error).message);
                } finally {
                  setSendingFeedback(false);
                }
              }}
            >
              <label className="sr-only" htmlFor="feedback-message">
                Share feedback
              </label>
              <input
                id="feedback-message"
                placeholder="An idea, a suggestion, a little feedback…"
                required
                maxLength={5000}
                value={feedback}
                onChange={(event) => {
                  setFeedback(event.target.value);
                  setFeedbackSent(false);
                }}
              />
              <button
                type="submit"
                className="button button-primary"
                disabled={sendingFeedback}
              >
                {sendingFeedback ? "Sending…" : "Submit feedback"}
                <Icon name="arrow" size={16} />
              </button>
              <span className="feedback-success" role="status">
                {feedbackSent ? "Thanks! Your feedback is saved." : ""}
              </span>
            </form>
          </section>
          <footer className="page-footer">
            <span>
              MemoFlow<span className="brand-period">.</span>
            </span>
            <p>A little space for your team's best work.</p>
            <span className="footer-workspace">
              <span className="online-dot" />
              Team Alpha
            </span>
          </footer>
        </main>
      </div>
      <dialog
        ref={dialog}
        className="note-dialog"
        onCancel={() => setComposing(false)}
        onClose={() => setComposing(false)}
        aria-labelledby="new-note-heading"
      >
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            setError("");
            const form = event.currentTarget;
            const values = new FormData(form);
            try {
              const data = await responseData(
                await fetch("/api/notes", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: values.get("title"),
                    body: values.get("body"),
                    currentWorkspaceId: WORKSPACE_ID,
                  }),
                }),
              );
              setNotes((current) => [data.note, ...current]);
              form.reset();
              setComposing(false);
              setNotice("Note created.");
            } catch (error) {
              setError((error as Error).message);
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="dialog-heading">
            <div>
              <p className="eyebrow">MAKE A LITTLE HEADSPACE</p>
              <h2 id="new-note-heading">A new team note</h2>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label="Close new note"
              onClick={() => setComposing(false)}
            >
              <Icon name="close" />
            </button>
          </div>
          <label htmlFor="note-title">Note title</label>
          <input
            id="note-title"
            ref={noteTitle}
            name="title"
            placeholder="Give your thought a title"
            required
            maxLength={180}
          />
          <label htmlFor="note-body">
            Note body <span>Markdown supported</span>
          </label>
          <textarea
            id="note-body"
            aria-label="Note body"
            name="body"
            placeholder="Start with what matters…"
            rows={9}
            required
            maxLength={20000}
          />
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <button
              className="button button-secondary"
              type="button"
              onClick={() => setComposing(false)}
            >
              Cancel
            </button>
            <button
              className="button button-primary"
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving…" : "Create note"}
              <Icon name="plus" size={16} />
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
