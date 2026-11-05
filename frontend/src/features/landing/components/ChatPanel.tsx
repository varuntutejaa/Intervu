import { FileText, X } from "lucide-react";
import type { ReactNode } from "react";
import type { Citation } from "../api";
import { ChatInput, type AttachedResume } from "./ChatInput";

export type ChatTurn =
  | { kind: "user"; text: string; resume: AttachedResume | null }
  | { kind: "assistant"; text: string; citations: Citation[] }
  | { kind: "assistant-error"; text: string };

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Shared dark "window" shell — same size and macOS-style traffic-light
// header for every panel, so it opens at the exact same size regardless of
// content underneath.
function PanelShell({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div className="flex h-[min(90vh,calc(100vh-9rem))] w-[90vw] flex-col overflow-hidden rounded-[32px] border border-black/10 bg-[#f7f7f8] shadow-2xl">
      <div className="flex shrink-0 items-center gap-2 border-b border-black/10 px-5 py-3">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="group flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#ff5f57] transition-transform hover:scale-110"
        >
          <X
            className="h-2 w-2 text-[#4d0000] opacity-0 transition-opacity group-hover:opacity-100"
            strokeWidth={3.5}
          />
        </button>
        <span className="h-3.5 w-3.5 rounded-full bg-[#febc2e]" />
        <span className="h-3.5 w-3.5 rounded-full bg-[#28c840]" />
      </div>

      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

export function ChatPanel({
  turns,
  isPending,
  resume,
  onResumeChange,
  onSend,
  onClose,
}: {
  turns: ChatTurn[];
  isPending: boolean;
  resume: AttachedResume | null;
  onResumeChange: (resume: AttachedResume | null) => void;
  onSend: (text: string, resume: AttachedResume | null) => void;
  onClose: () => void;
}) {
  return (
    <PanelShell onClose={onClose}>
      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto p-6 sm:p-8">
          {turns.map((turn, i) => {
            if (turn.kind === "user") {
              return (
                <div key={i} className="ml-auto flex max-w-[75%] flex-col items-end gap-2">
                  {turn.resume && (
                    <div className="flex w-fit items-center gap-2 rounded-lg border border-black/10 bg-black/5 px-3 py-2 text-xs text-black">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-black/60" />
                      <span className="truncate">{turn.resume.name}</span>
                      {turn.resume.kind === "file" && (
                        <span className="shrink-0 text-black/40">{formatFileSize(turn.resume.size)}</span>
                      )}
                    </div>
                  )}
                  {turn.text && (
                    <div className="w-fit rounded-2xl rounded-br-md bg-black px-4 py-2.5 text-sm text-white">
                      {turn.text}
                    </div>
                  )}
                </div>
              );
            }

            if (turn.kind === "assistant-error") {
              return (
                <div
                  key={i}
                  className="mr-auto w-fit max-w-[75%] rounded-2xl rounded-bl-md bg-red-50 px-4 py-2.5 text-sm text-red-700"
                >
                  {turn.text}
                </div>
              );
            }

            return (
              <div key={i} className="mr-auto flex max-w-[85%] flex-col gap-2">
                <div className="w-fit whitespace-pre-wrap rounded-2xl rounded-bl-md bg-black/10 px-4 py-2.5 text-sm leading-relaxed text-black">
                  {turn.text}
                </div>
                {turn.citations.length > 0 && (
                  <div className="ml-1 text-xs text-black/40">
                    <p className="font-medium text-black/50">References</p>
                    <ul className="mt-1 space-y-0.5">
                      {turn.citations.map((c, ci) => (
                        <li key={ci}>
                          {c.document} (Page {c.page})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}

          {isPending && (
            <div className="mr-auto w-fit rounded-2xl rounded-bl-md bg-black/10 px-4 py-2.5 text-sm text-black/50">
              Thinking…
            </div>
          )}
        </div>

        <div className="border-t border-black/10 p-4">
          <ChatInput compact resume={resume} onResumeChange={onResumeChange} onSubmit={onSend} />
        </div>
      </div>
    </PanelShell>
  );
}
