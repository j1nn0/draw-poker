export function updateHighScores(current, session) {
  return {
    maxCredits: Math.max(current.maxCredits, session.maxCreditReached),
    bestHandRank: Math.max(current.bestHandRank, session.bestHandRank),
    bestHandName:
      session.bestHandRank > current.bestHandRank
        ? session.bestHandName
        : current.bestHandName,
    maxDoubleUps: Math.max(current.maxDoubleUps, session.maxDoubleUps),
  };
}
