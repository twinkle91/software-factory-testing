# Design: a little more headspace

MemoFlow is a calm written workspace. Use a warm paper background, a pale sage sidebar, charcoal-green text, quiet outlined cards, and forest-green primary actions. Keep decoration restrained: one small leaf mark, simple line icons, generous spacing, and visible feedback for actions.

## Tokens

| Token       | Value     | Use                                |
| ----------- | --------- | ---------------------------------- |
| Paper       | `#fcfcf8` | Main canvas                        |
| Sidebar     | `#f3f5ed` | Workspace navigation               |
| Ink         | `#263832` | Primary content                    |
| Forest      | `#356e54` | Primary buttons, selected controls |
| Forest dark | `#28573f` | Hover                              |
| Border      | `#e6e9e1` | Quiet dividers                     |
| Sage        | `#e7eddf` | Supporting surfaces                |

Typography uses the system Arial/Helvetica sans-serif stack. Headings use restrained weight and tight letter spacing. Body content must wrap without truncating notes or CSV-sensitive titles. Action item titles preserve embedded newlines. Screen layouts adapt from a fixed desktop sidebar to a compact mobile navigation bar; the action table scrolls horizontally on narrow screens.

All interactive controls require labels, keyboard focus, and disabled/loading states. Modals use native dialog behavior. Errors use `role=alert`; successful actions use live status regions. Never depend on color alone for action status: always display the text. Follow the NoteCard and ExportCsvButton stories for regular, long-content, empty-selection, and exporting states.
