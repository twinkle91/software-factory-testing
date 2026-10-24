import ReactMarkdown from "react-markdown";
import type { Note } from "@/lib/types";
import { Icon } from "./Icon";

export function NoteCard({ note }: { note: Note }) {
  return (
    <article className="note-card">
      <div className="note-card-top">
        <span className="note-symbol">
          <Icon name="note" size={19} />
        </span>
        <span className="label">TEAM NOTE</span>
      </div>
      <h3>{note.title}</h3>
      <div className="markdown">
        <ReactMarkdown>{note.body}</ReactMarkdown>
      </div>
      <footer>
        <span className="avatar avatar-small">TA</span>
        <span>Team Alpha</span>
        <time dateTime={note.createdAt}>
          {new Date(note.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          })}
        </time>
      </footer>
    </article>
  );
}
