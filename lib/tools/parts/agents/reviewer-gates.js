import 'server-only';

export function shouldRunReviewer(state) {
  if (state.errors?.length) return true;
  if (state.metadata?.summaryRequested) return true;
  if ((state.tasks || []).length > 1) return true;
  if ((state.tasks || []).some((task) => task.confidence === 'low')) return true;
  return false;
}

export function summarizeReviewerNeed(state) {
  return {
    runReviewer: shouldRunReviewer(state),
    reason: state.errors?.length
      ? 'errors-present'
      : state.metadata?.summaryRequested
        ? 'summary-requested'
        : (state.tasks || []).length > 1
          ? 'multi-task-job'
          : (state.tasks || []).some((task) => task.confidence === 'low')
            ? 'low-confidence-task'
            : 'not-needed',
  };
}
