import Link from "next/link";
import { setTitleFeedbackAction } from "@/app/actions";
import type { FeedbackValue, MediaType } from "@/lib/types";

type TitleFeedbackActionsProps = {
  profileId: string | null;
  mediaId: number;
  mediaType: MediaType;
  returnTo: string;
  currentFeedback: FeedbackValue | null;
};

const feedbackOptions: Array<{ value: FeedbackValue; label: string }> = [
  { value: "like", label: "Loved it" },
  { value: "dislike", label: "Not for me" },
  { value: "not_interested", label: "Hide similar" },
];

export function TitleFeedbackActions({
  profileId,
  mediaId,
  mediaType,
  returnTo,
  currentFeedback,
}: TitleFeedbackActionsProps) {
  if (!profileId) {
    return (
      <Link href="/account" className="surface inline-flex items-center rounded-full px-5 py-3 text-sm text-white">
        Sign in to tune recommendations
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {feedbackOptions.map((option) => (
        <form key={option.value} action={setTitleFeedbackAction}>
          <input type="hidden" name="profileId" value={profileId} />
          <input type="hidden" name="mediaId" value={mediaId} />
          <input type="hidden" name="mediaType" value={mediaType} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <input type="hidden" name="value" value={currentFeedback === option.value ? "" : option.value} />
          <button
            className={`rounded-full px-4 py-2 text-sm transition ${
              currentFeedback === option.value
                ? "bg-[rgba(214,179,109,0.16)] text-white"
                : "surface text-[var(--color-text-muted)] hover:text-white"
            }`}
          >
            {option.label}
          </button>
        </form>
      ))}
    </div>
  );
}
