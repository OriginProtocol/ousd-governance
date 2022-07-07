import { BigNumber } from "ethers";
import numeral from "numeraljs";

export function getDailyRewardsEmissions(time = Date.now() / 1000) {
  // format: start_timestamp, end_timestamp, daily emissions
  const data = [
    [
      process.env.NODE_ENV === "development" ? 0 : 1657584000,
      1660176000,
      3333333,
    ],
    [1660176000, 1665360000, 2666667],
    [1665360000, 1675728000, 1866667],
    [1675728000, 1696464000, 1120000],
    [1696464000, 1727568000, 560000],
    [1727568000, 1779408000, 224000],
    [1779408000, 1862352000, 67200],
  ];

  const reward = data.find(
    ([startTime, endTime, dailyRewards]) => time > startTime && time < endTime
  );

  // 0 when rewards period has already finished
  return reward ? reward[2] : 0;
}

export function getRewardsApy(
  veOgvReceived: numeral,
  ogvToStake: numeral,
  totalSupplyVeOgv: numeral
) {
  if (totalSupplyVeOgv === 0 || ogvToStake === 0 || veOgvReceived === 0) {
    return 0;
  }

  const ogvPercentageOfRewards =
    veOgvReceived / (totalSupplyVeOgv + veOgvReceived);
  const ogvRewardsDaily = getDailyRewardsEmissions() * ogvPercentageOfRewards;
  const ogvRewardsYearly = ogvRewardsDaily * 365.25;
  // No need to use actual prices since originating tokens and reward tokens have the same price
  const ogvLockupRewardApr = ogvRewardsYearly / ogvToStake;

  /* APR to APY formula:
   * APY = Math.pow((1 + Periodic Rate), Number of periods) – 1
   *
   * picking 1 (1 year) as a number of periods. Since the rewards are not really going to be
   * compounding in this case
   */
  return ((1 + ogvLockupRewardApr / 1) ** 1 - 1) * 100;
}
