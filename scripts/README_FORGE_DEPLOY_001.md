To use the forge deploy script, you must first copy it to the "script" folder (it won't work in "scripts"). We don't keep them there, because they will break builds/tests if/when contracts change and the deploy no longer works.

Run local fork for test deploys:

```bash
anvil --fork-url "$PROVIDER_URL" --fork-block-number 15089000
```

Test deploy
```bash
forge script --fork-url 'http://localhost:8545' script/deploy_001_staking_rewards.sol --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

Run deploy:

```bash
forge script --rpc-url "$PROVIDER_URL" --etherscan-api-key "$ETHERSCAN_TOKEN" --verify script/deploy_001_staking_rewards.sol --broadcast -i 1 --sender "$SENDER_ADDRESS"
```


Fork test after deploy:

```python


from world import *
ogv = Contract.from_explorer('0x9c354503C38481a7A7a51629142963F98eCC12D0')
rewards = Contract.from_explorer('0x7d82e86cf1496f9485a8ea04012afeb3c7489397')
stakingImpl = Contract.from_explorer('0xfdf51e8497e9d64c595a49cf4df526ece47be393')
staking = Contract.from_abi('staking', '0xFdb16A6900Ce90Cb27Afec95dc274D27E0d61b87', stakingImpl.abi)

DEPLOYER_ALT = '0x71F78361537A6f7B6818e7A760c8bC0146D93f50';
DEPLOYER = '0x69e078EBc4631E1947F0c38Ef0357De7ED064644'

ogv.grantMinterRole(rewards, {'from': GOV_MULTISIG})
rewards.setRewardsTarget(staking, {'from': DEPLOYER})
staking.upgradeTo(newStakingImpl, {'from': DEPLOYER_ALT})



with TemporaryFork():
  print(c18(ogv.balanceOf(GOV_MULTISIG)))

  ogv.approve(staking, 1e70, {'from': GOV_MULTISIG})
  staking.stake(1e18, 30 * 24 * 60 * 60, {'from': GOV_MULTISIG})
  print(staking.lockups(GOV_MULTISIG, 0))
  
  chain.sleep(30 * 24 * 60 * 60)
  chain.mine()
  staking.previewRewards(GOV_MULTISIG)
  staking.collectRewards({'from': GOV_MULTISIG})
  show_transfers(history[-1])
  print("Should fail")
  staking.unstake(0, {'from': GOV_MULTISIG})
  
  chain.sleep(30 * 24 * 60 * 60)
  chain.mine()
  print(c18(staking.previewRewards(GOV_MULTISIG)))
  staking.unstake(0, {'from': GOV_MULTISIG})
  print(c18(ogv.balanceOf(GOV_MULTISIG)))
  staking.stake(1e18, 30 * 24 * 60 * 60, {'from': GOV_MULTISIG})

  chain.sleep(800 * 24 * 60 * 60)
  chain.mine()
  staking.collectRewards({'from': GOV_MULTISIG})
  print(c18(ogv.balanceOf(GOV_MULTISIG)))
```