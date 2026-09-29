export function canAdvancePractice(
  correct: boolean,
  revealed: boolean,
  mistakes: number,
) {
  return correct || revealed || mistakes >= 2;
}
export function needsPracticeReview(
  id: number,
  missed: Set<number>,
  reviewed: Set<number>,
) {
  return missed.has(id) && !reviewed.has(id);
}
