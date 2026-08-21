export function updateHighScores(current, session) {
  return {
    maxCredits: Math.max(current.maxCredits, session.maxCreditReached || 0),
    bestHandRank: Math.max(current.bestHandRank, session.bestHandRank || 0),
    bestHandName:
      (session.bestHandRank || 0) > current.bestHandRank
        ? session.bestHandName
        : current.bestHandName,
    maxDoubleUps: Math.max(current.maxDoubleUps, session.maxDoubleUps || 0),
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

export function mergeSessionResults(highScores, sessionStats) {
  return {
    ...updateHighScores(highScores, sessionStats),
    ...accumulateStats(highScores, sessionStats),
  };
}

export function detectNewRecords(previousHighScores, sessionPeak) {
  const records = [];
  if (sessionPeak.maxCreditReached > previousHighScores.maxCredits) {
    records.push("最高コイン");
  }
  if (sessionPeak.bestHandRank > previousHighScores.bestHandRank) {
    records.push("最高役");
  }
  if (sessionPeak.maxDoubleUps > previousHighScores.maxDoubleUps) {
    records.push("最大ダブルアップ");
  }
  return records;
}
