import fs from "fs";
import { ethers, BigNumber } from "ethers";
import EthereumEvents from "ethereum-events";
import Web3 from "web3";
import { last, merge } from "lodash";

type BlockHistory = {
  blockNumber: number;
  amount: BigNumber;
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const OGN_ADDRESS = "0x8207c1FfC5B6804F6024322CcF34F29c3541Ae26";
const OGN_DEPLOY_BLOCK = 6436154;
const OGN_ABI =
  '[{"constant":true,"inputs":[],"name":"whitelistActive","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"mintingFinished","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_transactor","type":"address"}],"name":"addAllowedTransactor","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"unpause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_amount","type":"uint256"}],"name":"mint","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_value","type":"uint256"}],"name":"burn","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_transactor","type":"address"}],"name":"removeAllowedTransactor","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"paused","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_subtractedValue","type":"uint256"}],"name":"decreaseApproval","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"renounceOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"finishMinting","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"},{"name":"_selector","type":"bytes4"},{"name":"_callParams","type":"bytes"}],"name":"approveAndCallWithSender","outputs":[{"name":"","type":"bool"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[],"name":"pause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"}],"name":"addCallSpenderWhitelist","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_who","type":"address"},{"name":"_value","type":"uint256"}],"name":"burn","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"whitelistExpiration","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"allowedTransactors","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_expiration","type":"uint256"}],"name":"setWhitelistExpiration","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_addedValue","type":"uint256"}],"name":"increaseApproval","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"}],"name":"removeCallSpenderWhitelist","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"callSpenderWhitelist","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"_initialSupply","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"enabler","type":"address"},{"indexed":false,"name":"spender","type":"address"}],"name":"AddCallSpenderWhitelist","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"disabler","type":"address"},{"indexed":false,"name":"spender","type":"address"}],"name":"RemoveCallSpenderWhitelist","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"expiration","type":"uint256"}],"name":"SetWhitelistExpiration","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"sender","type":"address"}],"name":"AllowedTransactorAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"sender","type":"address"}],"name":"AllowedTransactorRemoved","type":"event"},{"anonymous":false,"inputs":[],"name":"Pause","type":"event"},{"anonymous":false,"inputs":[],"name":"Unpause","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"Mint","type":"event"},{"anonymous":false,"inputs":[],"name":"MintFinished","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"}],"name":"OwnershipRenounced","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"burner","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Burn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}]';

const OUSD_POOL_ADDRESS = "0x87650D7bbfC3A9F10587d7778206671719d9910D";
const OUSD_POOL_DEPLOY_BLOCK = 12860905;
const OUSD_POOL_ABI = JSON.parse(
  '[{"name":"Transfer","inputs":[{"type":"address","name":"sender","indexed":true},{"type":"address","name":"receiver","indexed":true},{"type":"uint256","name":"value","indexed":false}],"anonymous":false,"type":"event"},{"name":"Approval","inputs":[{"type":"address","name":"owner","indexed":true},{"type":"address","name":"spender","indexed":true},{"type":"uint256","name":"value","indexed":false}],"anonymous":false,"type":"event"},{"name":"TokenExchange","inputs":[{"type":"address","name":"buyer","indexed":true},{"type":"int128","name":"sold_id","indexed":false},{"type":"uint256","name":"tokens_sold","indexed":false},{"type":"int128","name":"bought_id","indexed":false},{"type":"uint256","name":"tokens_bought","indexed":false}],"anonymous":false,"type":"event"},{"name":"TokenExchangeUnderlying","inputs":[{"type":"address","name":"buyer","indexed":true},{"type":"int128","name":"sold_id","indexed":false},{"type":"uint256","name":"tokens_sold","indexed":false},{"type":"int128","name":"bought_id","indexed":false},{"type":"uint256","name":"tokens_bought","indexed":false}],"anonymous":false,"type":"event"},{"name":"AddLiquidity","inputs":[{"type":"address","name":"provider","indexed":true},{"type":"uint256[2]","name":"token_amounts","indexed":false},{"type":"uint256[2]","name":"fees","indexed":false},{"type":"uint256","name":"invariant","indexed":false},{"type":"uint256","name":"token_supply","indexed":false}],"anonymous":false,"type":"event"},{"name":"RemoveLiquidity","inputs":[{"type":"address","name":"provider","indexed":true},{"type":"uint256[2]","name":"token_amounts","indexed":false},{"type":"uint256[2]","name":"fees","indexed":false},{"type":"uint256","name":"token_supply","indexed":false}],"anonymous":false,"type":"event"},{"name":"RemoveLiquidityOne","inputs":[{"type":"address","name":"provider","indexed":true},{"type":"uint256","name":"token_amount","indexed":false},{"type":"uint256","name":"coin_amount","indexed":false},{"type":"uint256","name":"token_supply","indexed":false}],"anonymous":false,"type":"event"},{"name":"RemoveLiquidityImbalance","inputs":[{"type":"address","name":"provider","indexed":true},{"type":"uint256[2]","name":"token_amounts","indexed":false},{"type":"uint256[2]","name":"fees","indexed":false},{"type":"uint256","name":"invariant","indexed":false},{"type":"uint256","name":"token_supply","indexed":false}],"anonymous":false,"type":"event"},{"name":"CommitNewAdmin","inputs":[{"type":"uint256","name":"deadline","indexed":true},{"type":"address","name":"admin","indexed":true}],"anonymous":false,"type":"event"},{"name":"NewAdmin","inputs":[{"type":"address","name":"admin","indexed":true}],"anonymous":false,"type":"event"},{"name":"CommitNewFee","inputs":[{"type":"uint256","name":"deadline","indexed":true},{"type":"uint256","name":"fee","indexed":false},{"type":"uint256","name":"admin_fee","indexed":false}],"anonymous":false,"type":"event"},{"name":"NewFee","inputs":[{"type":"uint256","name":"fee","indexed":false},{"type":"uint256","name":"admin_fee","indexed":false}],"anonymous":false,"type":"event"},{"name":"RampA","inputs":[{"type":"uint256","name":"old_A","indexed":false},{"type":"uint256","name":"new_A","indexed":false},{"type":"uint256","name":"initial_time","indexed":false},{"type":"uint256","name":"future_time","indexed":false}],"anonymous":false,"type":"event"},{"name":"StopRampA","inputs":[{"type":"uint256","name":"A","indexed":false},{"type":"uint256","name":"t","indexed":false}],"anonymous":false,"type":"event"},{"outputs":[],"inputs":[],"savedProgressMutability":"nonpayable","type":"constructor"},{"name":"initialize","outputs":[],"inputs":[{"type":"string","name":"_name"},{"type":"string","name":"_symbol"},{"type":"address","name":"_coin"},{"type":"uint256","name":"_decimals"},{"type":"uint256","name":"_A"},{"type":"uint256","name":"_fee"},{"type":"address","name":"_admin"}],"savedProgressMutability":"nonpayable","type":"function","gas":470049},{"name":"decimals","outputs":[{"type":"uint256","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":291},{"name":"transfer","outputs":[{"type":"bool","name":""}],"inputs":[{"type":"address","name":"_to"},{"type":"uint256","name":"_value"}],"savedProgressMutability":"nonpayable","type":"function","gas":75402},{"name":"transferFrom","outputs":[{"type":"bool","name":""}],"inputs":[{"type":"address","name":"_from"},{"type":"address","name":"_to"},{"type":"uint256","name":"_value"}],"savedProgressMutability":"nonpayable","type":"function","gas":112037},{"name":"approve","outputs":[{"type":"bool","name":""}],"inputs":[{"type":"address","name":"_spender"},{"type":"uint256","name":"_value"}],"savedProgressMutability":"nonpayable","type":"function","gas":37854},{"name":"get_previous_balances","outputs":[{"type":"uint256[2]","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":2254},{"name":"get_balances","outputs":[{"type":"uint256[2]","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":2284},{"name":"get_twap_balances","outputs":[{"type":"uint256[2]","name":""}],"inputs":[{"type":"uint256[2]","name":"_first_balances"},{"type":"uint256[2]","name":"_last_balances"},{"type":"uint256","name":"_time_elapsed"}],"savedProgressMutability":"view","type":"function","gas":1522},{"name":"get_price_cumulative_last","outputs":[{"type":"uint256[2]","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":2344},{"name":"admin_fee","outputs":[{"type":"uint256","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":621},{"name":"A","outputs":[{"type":"uint256","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":5859},{"name":"A_precise","outputs":[{"type":"uint256","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":5821},{"name":"get_virtual_price","outputs":[{"type":"uint256","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":1011891},{"name":"calc_token_amount","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"uint256[2]","name":"_amounts"},{"type":"bool","name":"_is_deposit"}],"savedProgressMutability":"view","type":"function"},{"name":"calc_token_amount","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"uint256[2]","name":"_amounts"},{"type":"bool","name":"_is_deposit"},{"type":"bool","name":"_previous"}],"savedProgressMutability":"view","type":"function"},{"name":"add_liquidity","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"uint256[2]","name":"_amounts"},{"type":"uint256","name":"_min_mint_amount"}],"savedProgressMutability":"nonpayable","type":"function"},{"name":"add_liquidity","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"uint256[2]","name":"_amounts"},{"type":"uint256","name":"_min_mint_amount"},{"type":"address","name":"_receiver"}],"savedProgressMutability":"nonpayable","type":"function"},{"name":"get_dy","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"int128","name":"i"},{"type":"int128","name":"j"},{"type":"uint256","name":"dx"}],"savedProgressMutability":"view","type":"function"},{"name":"get_dy","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"int128","name":"i"},{"type":"int128","name":"j"},{"type":"uint256","name":"dx"},{"type":"uint256[2]","name":"_balances"}],"savedProgressMutability":"view","type":"function"},{"name":"get_dy_underlying","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"int128","name":"i"},{"type":"int128","name":"j"},{"type":"uint256","name":"dx"}],"savedProgressMutability":"view","type":"function"},{"name":"get_dy_underlying","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"int128","name":"i"},{"type":"int128","name":"j"},{"type":"uint256","name":"dx"},{"type":"uint256[2]","name":"_balances"}],"savedProgressMutability":"view","type":"function"},{"name":"exchange","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"int128","name":"i"},{"type":"int128","name":"j"},{"type":"uint256","name":"dx"},{"type":"uint256","name":"min_dy"}],"savedProgressMutability":"nonpayable","type":"function"},{"name":"exchange","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"int128","name":"i"},{"type":"int128","name":"j"},{"type":"uint256","name":"dx"},{"type":"uint256","name":"min_dy"},{"type":"address","name":"_receiver"}],"savedProgressMutability":"nonpayable","type":"function"},{"name":"exchange_underlying","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"int128","name":"i"},{"type":"int128","name":"j"},{"type":"uint256","name":"dx"},{"type":"uint256","name":"min_dy"}],"savedProgressMutability":"nonpayable","type":"function"},{"name":"exchange_underlying","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"int128","name":"i"},{"type":"int128","name":"j"},{"type":"uint256","name":"dx"},{"type":"uint256","name":"min_dy"},{"type":"address","name":"_receiver"}],"savedProgressMutability":"nonpayable","type":"function"},{"name":"remove_liquidity","outputs":[{"type":"uint256[2]","name":""}],"inputs":[{"type":"uint256","name":"_burn_amount"},{"type":"uint256[2]","name":"_min_amounts"}],"savedProgressMutability":"nonpayable","type":"function"},{"name":"remove_liquidity","outputs":[{"type":"uint256[2]","name":""}],"inputs":[{"type":"uint256","name":"_burn_amount"},{"type":"uint256[2]","name":"_min_amounts"},{"type":"address","name":"_receiver"}],"savedProgressMutability":"nonpayable","type":"function"},{"name":"remove_liquidity_imbalance","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"uint256[2]","name":"_amounts"},{"type":"uint256","name":"_max_burn_amount"}],"savedProgressMutability":"nonpayable","type":"function"},{"name":"remove_liquidity_imbalance","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"uint256[2]","name":"_amounts"},{"type":"uint256","name":"_max_burn_amount"},{"type":"address","name":"_receiver"}],"savedProgressMutability":"nonpayable","type":"function"},{"name":"calc_withdraw_one_coin","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"uint256","name":"_burn_amount"},{"type":"int128","name":"i"}],"savedProgressMutability":"view","type":"function"},{"name":"calc_withdraw_one_coin","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"uint256","name":"_burn_amount"},{"type":"int128","name":"i"},{"type":"bool","name":"_previous"}],"savedProgressMutability":"view","type":"function"},{"name":"remove_liquidity_one_coin","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"uint256","name":"_burn_amount"},{"type":"int128","name":"i"},{"type":"uint256","name":"_min_received"}],"savedProgressMutability":"nonpayable","type":"function"},{"name":"remove_liquidity_one_coin","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"uint256","name":"_burn_amount"},{"type":"int128","name":"i"},{"type":"uint256","name":"_min_received"},{"type":"address","name":"_receiver"}],"savedProgressMutability":"nonpayable","type":"function"},{"name":"ramp_A","outputs":[],"inputs":[{"type":"uint256","name":"_future_A"},{"type":"uint256","name":"_future_time"}],"savedProgressMutability":"nonpayable","type":"function","gas":152464},{"name":"stop_ramp_A","outputs":[],"inputs":[],"savedProgressMutability":"nonpayable","type":"function","gas":149225},{"name":"admin_balances","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"uint256","name":"i"}],"savedProgressMutability":"view","type":"function","gas":3601},{"name":"withdraw_admin_fees","outputs":[],"inputs":[],"savedProgressMutability":"nonpayable","type":"function","gas":11347},{"name":"admin","outputs":[{"type":"address","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":2141},{"name":"coins","outputs":[{"type":"address","name":""}],"inputs":[{"type":"uint256","name":"arg0"}],"savedProgressMutability":"view","type":"function","gas":2280},{"name":"balances","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"uint256","name":"arg0"}],"savedProgressMutability":"view","type":"function","gas":2310},{"name":"fee","outputs":[{"type":"uint256","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":2231},{"name":"block_timestamp_last","outputs":[{"type":"uint256","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":2261},{"name":"initial_A","outputs":[{"type":"uint256","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":2291},{"name":"future_A","outputs":[{"type":"uint256","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":2321},{"name":"initial_A_time","outputs":[{"type":"uint256","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":2351},{"name":"future_A_time","outputs":[{"type":"uint256","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":2381},{"name":"name","outputs":[{"type":"string","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":8813},{"name":"symbol","outputs":[{"type":"string","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":7866},{"name":"balanceOf","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"address","name":"arg0"}],"savedProgressMutability":"view","type":"function","gas":2686},{"name":"allowance","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"address","name":"arg0"},{"type":"address","name":"arg1"}],"savedProgressMutability":"view","type":"function","gas":2931},{"name":"totalSupply","outputs":[{"type":"uint256","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":2531}]'
);
const CONVEX_POOL_ADDRESS = "0x7D536a737C13561e0D2Decf1152a653B4e615158";
const CONVEX_POOL_DEPLOY_BLOCK = 13601868;
const CONVEX_POOL_ABI = JSON.parse(
  '[{"inputs":[{"internalType":"uint256","name":"pid_","type":"uint256"},{"internalType":"address","name":"stakingToken_","type":"address"},{"internalType":"address","name":"rewardToken_","type":"address"},{"internalType":"address","name":"operator_","type":"address"},{"internalType":"address","name":"rewardManager_","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"reward","type":"uint256"}],"name":"RewardAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"reward","type":"uint256"}],"name":"RewardPaid","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Staked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Withdrawn","type":"event"},{"inputs":[{"internalType":"address","name":"_reward","type":"address"}],"name":"addExtraReward","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"clearExtraRewards","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"currentRewards","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"donate","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"duration","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"earned","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"extraRewards","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"extraRewardsLength","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getReward","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_account","type":"address"},{"internalType":"bool","name":"_claimExtras","type":"bool"}],"name":"getReward","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"historicalRewards","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"lastTimeRewardApplicable","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"lastUpdateTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"newRewardRatio","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"operator","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"periodFinish","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pid","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_rewards","type":"uint256"}],"name":"queueNewRewards","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"queuedRewards","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rewardManager","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rewardPerToken","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rewardPerTokenStored","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rewardRate","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rewardToken","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"rewards","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"stake","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"stakeAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_for","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"stakeFor","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"stakingToken","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"userRewardPerTokenPaid","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bool","name":"claim","type":"bool"}],"name":"withdraw","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bool","name":"claim","type":"bool"}],"name":"withdrawAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bool","name":"claim","type":"bool"}],"name":"withdrawAllAndUnwrap","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bool","name":"claim","type":"bool"}],"name":"withdrawAndUnwrap","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}]'
);

const OUSD_ADDRESS = "0x2A8e1E676Ec238d8A992307B495b45B3fEAa5e86";
const OUSD_DEPLOY_BLOCK = 10884563;
const OUSD_ABI = JSON.parse(
  '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousGovernor","type":"address"},{"indexed":true,"internalType":"address","name":"newGovernor","type":"address"}],"name":"GovernorshipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousGovernor","type":"address"},{"indexed":true,"internalType":"address","name":"newGovernor","type":"address"}],"name":"PendingGovernorshipTransfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"totalSupply","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"rebasingCredits","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"rebasingCreditsPerToken","type":"uint256"}],"name":"TotalSupplyUpdatedHighres","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[],"name":"_totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_owner","type":"address"},{"internalType":"address","name":"_spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_spender","type":"address"},{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"burn","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_newTotalSupply","type":"uint256"}],"name":"changeSupply","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"claimGovernance","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_account","type":"address"}],"name":"creditsBalanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_account","type":"address"}],"name":"creditsBalanceOfHighres","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_spender","type":"address"},{"internalType":"uint256","name":"_subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"governor","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_spender","type":"address"},{"internalType":"uint256","name":"_addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"_nameArg","type":"string"},{"internalType":"string","name":"_symbolArg","type":"string"},{"internalType":"address","name":"_vaultAddress","type":"address"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"isGovernor","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"isUpgraded","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_account","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"nonRebasingCreditsPerToken","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nonRebasingSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rebaseOptIn","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"rebaseOptOut","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"rebaseState","outputs":[{"internalType":"enum OUSD.RebaseOptions","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rebasingCredits","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rebasingCreditsHighres","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rebasingCreditsPerToken","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rebasingCreditsPerTokenHighres","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_to","type":"address"},{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_from","type":"address"},{"internalType":"address","name":"_to","type":"address"},{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_newGovernor","type":"address"}],"name":"transferGovernance","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"vaultAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}]'
);
const WOUSD_ADDRESS = "0xD2af830E8CBdFed6CC11Bab697bB25496ed6FA62";
const WOUSD_DEPLOY_BLOCK = 14566204;
const WOUSD_ABI = JSON.parse(
  '[{"inputs":[{"internalType":"contract ERC20","name":"underlying_","type":"address"},{"internalType":"string","name":"name_","type":"string"},{"internalType":"string","name":"symbol_","type":"string"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"caller","type":"address"},{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":false,"internalType":"uint256","name":"assets","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"shares","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousGovernor","type":"address"},{"indexed":true,"internalType":"address","name":"newGovernor","type":"address"}],"name":"GovernorshipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousGovernor","type":"address"},{"indexed":true,"internalType":"address","name":"newGovernor","type":"address"}],"name":"PendingGovernorshipTransfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"caller","type":"address"},{"indexed":true,"internalType":"address","name":"receiver","type":"address"},{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":false,"internalType":"uint256","name":"assets","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"shares","type":"uint256"}],"name":"Withdraw","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"asset","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"claimGovernance","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"shares","type":"uint256"}],"name":"convertToAssets","outputs":[{"internalType":"uint256","name":"assets","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"assets","type":"uint256"}],"name":"convertToShares","outputs":[{"internalType":"uint256","name":"shares","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"assets","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"}],"name":"deposit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"governor","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"isGovernor","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"maxDeposit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"maxMint","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"maxRedeem","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"maxWithdraw","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"shares","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"}],"name":"mint","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"assets","type":"uint256"}],"name":"previewDeposit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"shares","type":"uint256"}],"name":"previewMint","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"shares","type":"uint256"}],"name":"previewRedeem","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"assets","type":"uint256"}],"name":"previewWithdraw","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"shares","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"},{"internalType":"address","name":"owner","type":"address"}],"name":"redeem","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalAssets","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_newGovernor","type":"address"}],"name":"transferGovernance","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"asset_","type":"address"},{"internalType":"uint256","name":"amount_","type":"uint256"}],"name":"transferToken","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"assets","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"},{"internalType":"address","name":"owner","type":"address"}],"name":"withdraw","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"}]'
);

const STOP_BLOCK = 14592991;

const PROGRESS_FILE = "progress.json";

let savedProgress;
try {
  savedProgress = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
} catch (error) {
  console.log("No progress file, starting from first deployment");
  savedProgress = {
    blockNumber: Math.min(
      OUSD_POOL_DEPLOY_BLOCK,
      CONVEX_POOL_DEPLOY_BLOCK,
      OUSD_DEPLOY_BLOCK,
      WOUSD_DEPLOY_BLOCK
    ),
    curveLiquidity: {},
    convexLiquidity: {},
    ousdHolders: {},
    ousdRebasers: [],
    wousdHolders: {},
  };
}

const options = {
  pollInterval: 10000, // period between polls in milliseconds (default: 13000)
  // Confirmed as soon as we've got it. No real problem with reorgs.
  // Don't use an integer here because it is falsy
  confirmations: "0",
  chunkSize: 10000, // n° of blocks to fetch at a time (default: 10000)
  concurrency: 10, // maximum n° of concurrent web3 requests (default: 10)
  backoff: 1000, // retry backoff in milliseconds (default: 1000)
  // Note: this flag is the reason for the commit specific dependency in package.json
  ignoreUnknownEvents: true,
};

const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);

const web3 = new Web3(process.env.PROVIDER_URL);

const ognContract = {
  name: "OGN",
  address: OGN_ADDRESS,
  abi: OGN_ABI,
  events: ["Transfer"],
};

const curveContract = {
  name: "OUSD3CRV-f",
  address: OUSD_POOL_ADDRESS,
  abi: OUSD_POOL_ABI,
  events: ["Transfer"],
};

const convexContract = {
  name: "OUSD3CRV-f",
  address: CONVEX_POOL_ADDRESS,
  abi: CONVEX_POOL_ABI,
  events: ["Staked", "Withdrawn"],
};

const ousdContract = {
  name: "OUSD",
  address: OUSD_ADDRESS,
  abi: OUSD_ABI,
  events: ["Transfer"],
};

const wousdContract = {
  name: "wOUSD",
  address: WOUSD_ADDRESS,
  abi: WOUSD_ABI,
  events: ["Transfer"],
};

const contracts = [curveContract, convexContract, ousdContract, wousdContract];

const ethereumEvents = new EthereumEvents(web3, contracts, options);

const {
  curveLiquidity,
  convexLiquidity,
  ousdHolders,
  ousdRebasers,
  wousdHolders,
} = savedProgress;

const bigNumberify = (value) => {
  if (BigNumber.isBigNumber(value)) {
    return value;
  } else {
    return BigNumber.from(value);
  }
};

// Handler for Curve events
const handleCurveTransfer = async (blockNumber, event) => {
  // Debit sender, unless its the 0 address (i.e. AddLiquidity)
  if (event.values.sender !== ZERO_ADDRESS) {
    curveLiquidity[event.values.sender].push({
      blockNumber: blockNumber,
      // Subtract removed liquidity from the last entry
      amount: bigNumberify(
        last(curveLiquidity[event.values.sender]).amount
      ).sub(bigNumberify(event.values.value)),
    });
  }
  if (event.values.receiver !== ZERO_ADDRESS) {
    if (curveLiquidity[event.values.receiver] === undefined) {
      curveLiquidity[event.values.receiver] = [
        {
          blockNumber: blockNumber,
          amount: event.values.value,
        },
      ];
    } else {
      curveLiquidity[event.values.receiver].push({
        blockNumber: blockNumber,
        amount: bigNumberify(
          last(curveLiquidity[event.values.receiver]).amount
        ).add(bigNumberify(event.values.value)),
      });
    }
  }
};

// Handler for Convex events
const handleConvexEvent = async (blockNumber, event) => {
  if (event.name == "Staked") {
    // This only needs to be done once in add liquidity because it should
    // always be initialised before removing liquidity
    if (convexLiquidity[event.values.user] === undefined) {
      convexLiquidity[event.values.user] = [
        {
          blockNumber,
          amount: bigNumberify(event.values.amount),
        },
      ];
    } else {
      convexLiquidity[event.values.user].push({
        blockNumber,
        amount: bigNumberify(
          last(convexLiquidity[event.values.user]).amount
        ).add(bigNumberify(event.values.amount)),
      });
    }
  } else if (event.name == "Withdrawn") {
    convexLiquidity[event.values.user].push({
      blockNumber,
      amount: bigNumberify(last(convexLiquidity[event.values.user]).amount).sub(
        bigNumberify(event.values.amount)
      ),
    });
  }
};

const handleOusdTransfer = async (blockNumber, event) => {
  // Do nothing on zero value transfers
  if (event.values.value === "0") return;
  // Debit sender, unless its the 0 address
  if (event.values.from !== ZERO_ADDRESS) {
    ousdHolders[event.values.from].push({
      blockNumber: blockNumber,
      // Subtract removed liquidity from the last entry
      amount: bigNumberify(last(ousdHolders[event.values.from]).amount).sub(
        bigNumberify(event.values.value)
      ),
    });
  }
  if (event.values.to !== ZERO_ADDRESS) {
    if (ousdHolders[event.values.to] === undefined) {
      ousdHolders[event.values.to] = [
        {
          blockNumber: blockNumber,
          amount: event.values.value,
        },
      ];
      /*
      // If not is contract, add to rebasers
      if ((await provider.getCode(event.values.to)) === "0x") {
        ousdRebasers.push(event.values.to);
      }
      */
    } else {
      ousdHolders[event.values.to].push({
        blockNumber: blockNumber,
        amount: bigNumberify(last(ousdHolders[event.values.to]).amount).add(
          bigNumberify(event.values.value)
        ),
      });
    }
  }
};

const handleOusdRebase = async (blockNumber, event) => {
  for (const address in ousdRebasers) {
    // TODO handle rebase
    // For every OUSD user that has rebase, we need to add the rebase amount to the last entry
  }
};

const handleWousdTransfer = async (blockNumber, event) => {
  // Debit sender, unless its the 0 address
  if (event.values.from !== ZERO_ADDRESS) {
    wousdHolders[event.values.from].push({
      blockNumber: blockNumber,
      // Subtract removed liquidity from the last entry
      amount: bigNumberify(last(wousdHolders[event.values.from]).amount).sub(
        bigNumberify(event.values.value)
      ),
    });
  }
  if (event.values.to !== ZERO_ADDRESS) {
    if (wousdHolders[event.values.to] === undefined) {
      wousdHolders[event.values.to] = [
        {
          blockNumber: blockNumber,
          amount: event.values.value,
        },
      ];
    } else {
      wousdHolders[event.values.to].push({
        blockNumber: blockNumber,
        amount: bigNumberify(last(wousdHolders[event.values.to]).amount).add(
          bigNumberify(event.values.value)
        ),
      });
    }
  }
};

ethereumEvents.on("block.confirmed", async (blockNumber, events, done) => {
  for (const event of events) {
    if (event.to === curveContract.address) {
      handleCurveTransfer(blockNumber, event);
    } else if (event.to === convexContract.address) {
      handleConvexEvent(blockNumber, event);
    } else if (event.to === ousdContract.address) {
      handleOusdTransfer(blockNumber, event);
    } else if (event.to === wousdContract.address) {
      handleWousdTransfer(blockNumber, event);
    }
  }

  if (blockNumber) {
    process.stdout.write(
      `${blockNumber} - ${
        Object.keys(curveLiquidity).length
      } Curve providers, ${
        Object.keys(convexLiquidity).length
      } Convex providers, ${Object.keys(ousdHolders).length} OUSD holders, ${
        Object.keys(wousdHolders).length
      } wOUSD holders\r`
    );
  }

  // Save the progress every 50000 blocks
  if (blockNumber % 50000 === 0) {
    savedProgress = {
      blockNumber,
      curveLiquidity,
      convexLiquidity,
      ousdHolders,
      wousdHolders,
    };
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(savedProgress));
  }

  if (blockNumber === STOP_BLOCK) {
    console.log("\n");
    ethereumEvents.stop();

    const curveRewards = rewardScore("curve", curveLiquidity);
    console.log("Calculating Curve rewards");
    const convexRewards = rewardScore("convex", convexLiquidity);
    console.log("Calculating Convex rewards");
    const ousdHoldersRewards = rewardScore("ousd", ousdHolders);
    console.log("Calculating OUSD rewards");
    const wousdHoldersRewards = rewardScore("wousd", wousdHolders);
    console.log("Calculating wOUSD rewards");
    const allRewards = merge(
      {},
      curveRewards,
      convexRewards,
      ousdHoldersRewards,
      wousdHoldersRewards
    );

    const csv = Object.entries(allRewards).map(([address, rewards]) => {
      const total = Object.keys(rewards).reduce((total, reward) => {
        return total.add(rewards[reward]);
      }, bigNumberify(0));
      return `${address},${["curve", "convex", "ousd", "wousd"]
        .map((key) =>
          rewards[key] === undefined ? 0 : rewards[key].toString()
        )
        .join(",")},${total}`;
    });

    fs.writeFileSync("retroactive-rewards.csv", csv.join("\n"));
  }

  done();
});

const rewardScore = (desc, addressHistory) => {
  // Calculate total rewards score by muiltiplying the amount of holdings by the block time held for
  return Object.entries(addressHistory)
    .map(
      ([address, history]: [address: string, history: Array<BlockHistory>]) => {
        return {
          address,
          history,
          score: history.reduce(
            (acc, { blockNumber, amount }, currentIndex) => {
              // Ignore amounts less than 0, this can happen with OUSD due to the rebased yield not being included
              if (bigNumberify(amount).lt(0)) return acc;
              if (currentIndex > 0) {
                acc = acc.add(
                  // Multiply amount by the difference in block numbers
                  bigNumberify(amount).mul(
                    blockNumber - history[currentIndex - 1].blockNumber
                  )
                );
              } else if ((currentIndex = history.length - 1)) {
                // If this is the last history entry, multiple the last seen amount by the difference
                // in block numbers between the last entry and the current block
                acc = acc.add(
                  bigNumberify(amount).mul(STOP_BLOCK - blockNumber)
                );
              }
              return acc;
            },
            BigNumber.from(0)
          ),
        };
      }
    )
    .reduce(
      (obj, item) =>
        Object.assign(obj, { [item.address]: { [desc]: item.score } }),
      {}
    );
};

console.log("Searching for events...");

ethereumEvents.start(savedProgress.blockNumber);
