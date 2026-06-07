import { sendMessage, requestInterview } from "@/app/actions/connection";

export type ThreadMessage = {
  id: string;
  senderRole: string;
  body: string;
  createdAt: Date;
};

export function MatchThread({
  matchId,
  viewerRole,
  messages,
  interviewRequestedBy,
  interviewRequestedAt,
}: {
  matchId: string;
  viewerRole: "CANDIDATE" | "EMPLOYER";
  messages: ThreadMessage[];
  interviewRequestedBy: string | null;
  interviewRequestedAt: Date | null;
}) {
  return (
    <div className="card flex h-[32rem] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">
            No messages yet. Send the first one.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderRole === viewerRole;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                    mine
                      ? "bg-brand-600 text-white"
                      : "bg-stone-100 text-stone-800"
                  }`}
                >
                  {m.body}
                  <div
                    className={`mt-1 text-[10px] ${
                      mine ? "text-brand-100" : "text-stone-400"
                    }`}
                  >
                    {new Date(m.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-3 border-t border-stone-100 pt-3">
        {interviewRequestedAt ? (
          <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-200">
            Interview requested by the{" "}
            {interviewRequestedBy === viewerRole
              ? "you"
              : interviewRequestedBy === "CANDIDATE"
                ? "candidate"
                : "home"}
            . The platform&apos;s MVP job is done — take it from here directly.
          </p>
        ) : (
          <form action={requestInterview} className="mb-3">
            <input type="hidden" name="matchId" value={matchId} />
            <button type="submit" className="btn-secondary w-full justify-center">
              Request to interview
            </button>
          </form>
        )}

        <form action={sendMessage} className="flex gap-2">
          <input type="hidden" name="matchId" value={matchId} />
          <input
            name="body"
            required
            autoComplete="off"
            placeholder="Write a message…"
            className="input"
          />
          <button type="submit" className="btn-primary">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
