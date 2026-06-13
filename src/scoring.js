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

export function mergeSessionResults(highScores, sessionStats) {
  return {
    ...updateHighScores(highScores, sessionStats),
    ...accumulateStats(highScores, sessionStats),
  };
}

export function detectNewRecords(updatedHighScores, previousHighScores, sessionPeak) {
  const records = [];
  if (updatedHighScores.maxCredits === sessionPeak.maxCreditReached && sessionPeak.maxCreditReached > previousHighScores.maxCredits) {
    records.push("最高コイン");
  }
  if (updatedHighScores.bestHandRank === sessionPeak.bestHandRank && sessionPeak.bestHandRank > previousHighScores.bestHandRank) {
    records.push("最高役");
  }
  if (updatedHighScores.maxDoubleUps === sessionPeak.maxDoubleUps && sessionPeak.maxDoubleUps > previousHighScores.maxDoubleUps) {
    records.push("最大ダブルアップ");
  }
  return records;
}
