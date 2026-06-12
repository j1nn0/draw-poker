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

export function accumulateStats(current, session) {
  return {
    totalGamesPlayed: current.totalGamesPlayed + (session.gamesPlayed || 0),
    totalGamesWon: current.totalGamesWon + (session.gamesWon || 0),
    totalBet: current.totalBet + (session.totalBet || 0),
    totalPayout: current.totalPayout + (session.totalPayout || 0),
  };
}
