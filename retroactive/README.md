# OGV Airdrop

This package is responsible for generating merkle trees for the OGV (Origin Governance) airdrop.

## Airdrop 1: OGN Holders + OUSD LM Campaign

### OGN Holders

1000000000 OGV is distributed proportionally among holders of OGN at the time of the snapshot.

### OUSD LM Campaign

LM campaign rewards are calculated using liqudity amount \* number of blocks for:

- Holders of OUSD3CRV-f
- Holders of OUSD3CRV-f-gauge (i.e. OUSD3CRV-f staked in the Curve gauge)
- Liquidity staked in Convex

The LM campaign runs between two blocks, starting at the announcement of the LM campaign and finishing at the snapshot.

50000000 OGV is distributed proportionally among these liquidity providers.

## Airdrop 2: Historical OUSD and wOUSD holders

Both OUSD and wOUSD holders are rewarded for their historical holdings according to amount \* number of blocks held for. These rewards commence at the relaunch of OUSD and the launch of wOUSD until the snapshot date.

400000000 OGV is distributed proportionally among these holders.

## Using this repository

The first airdrop can be generated using:

`yarn run start:ogn`

The second airdrop can be generated using:

`yarn run start:ousd`

Both scripts use a progress file so that the airdrop generation can be resumed if it terminates early due to RPC or other error.
