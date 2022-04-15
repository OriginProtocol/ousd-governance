select
  toTxs.toAddr,
  (ifnull(recv, 0) - ifnull(sent, 0)) / 1e18 as balance,
  sent / 1e18 as sent,
  recv / 1e18 as recv
from (
    select
    tx.to_address as toAddr,
    sum(cast(tx.value as numeric)) as recv
    from `bigquery-public-data.crypto_ethereum.token_transfers` AS tx
    where tx.token_address = lower("0x8207c1FfC5B6804F6024322CcF34F29c3541Ae26")
    and tx.block_number < 14567120
    group by 1
) as toTxs full outer join (
    select
    tx.from_address as fromAddr,
    sum(cast(tx.value as numeric)) as sent
    from `bigquery-public-data.crypto_ethereum.token_transfers` AS tx
    where tx.token_address = lower("0x8207c1FfC5B6804F6024322CcF34F29c3541Ae26")
    and tx.block_number < 14567120
    group by 1
) as fromTxs on toTxs.toAddr = fromTxs.fromAddr where (ifnull(recv, 0) - ifnull(sent, 0)) > 0
order by 2 desc
