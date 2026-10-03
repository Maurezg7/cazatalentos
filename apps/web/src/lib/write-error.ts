export function writeErrorText(error: unknown): string {
  const parts: string[] = [];
  if (error instanceof Error) {
    parts.push(error.message);
  }
  if (error && typeof error === 'object') {
    if ('shortMessage' in error && typeof error.shortMessage === 'string') {
      parts.push(error.shortMessage);
    }
    if ('message' in error && typeof error.message === 'string') {
      parts.push(error.message);
    }
    if ('details' in error && typeof error.details === 'string') {
      parts.push(error.details);
    }
  }
  return parts.join(' ');
}

export function isVotingStillOpenError(error: unknown): boolean {
  const text = writeErrorText(error).toLowerCase();
  if (text.includes('votingstillopen') || text.includes('voting still open')) {
    return true;
  }
  if (error && typeof error === 'object') {
    if ('data' in error && error.data && typeof error.data === 'object' && 'errorName' in error.data) {
      return error.data.errorName === 'VotingStillOpen';
    }
    if ('cause' in error) {
      return isVotingStillOpenError(error.cause);
    }
  }
  return false;
}
