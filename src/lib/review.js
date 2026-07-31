export const REVIEW_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  DISMISSED: "dismissed",
};

// Existing analysis records created before the review workflow are treated as drafts,
// not as coach-approved evidence.
export function isApprovedEvent(event) {
  return event?.review_status === REVIEW_STATUS.APPROVED;
}

export function isDismissedEvent(event) {
  return event?.review_status === REVIEW_STATUS.DISMISSED;
}

export function isPendingReview(event) {
  return !isApprovedEvent(event) && !isDismissedEvent(event);
}

export function reviewStatusLabel(event) {
  if (isApprovedEvent(event)) return "Coach approved";
  if (isDismissedEvent(event)) return "Dismissed";
  return "Review required";
}
