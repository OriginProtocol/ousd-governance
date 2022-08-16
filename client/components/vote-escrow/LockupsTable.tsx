import { FunctionComponent, useState } from "react";
import moment from "moment";
import Card from "components/Card";
import TokenAmount from "components/TokenAmount";
import { Loading } from "components/Loading";
import TimeToDate from "components/TimeToDate";
import Link from "components/Link";
import Button from "components/Button";
import { useStore } from "utils/store";
import useAccountBalances from "utils/useAccountBalances";
import useTotalBalances from "utils/useTotalBalances";
import useLockups from "utils/useLockups";
import { toast } from "react-toastify";
import Modal from "components/Modal";
import { truncateEthAddress } from "utils";
import EtherscanIcon from "components/EtherscanIcon";
import ExternalLinkIcon from "../ExternalLinkIcon";

const LockupsTable: FunctionComponent = () => {
  const { lockups, pendingTransactions, contracts, blockTimestamp, chainId } =
    useStore();

  const { reloadTotalBalances } = useTotalBalances();
  const { reloadAccountBalances } = useAccountBalances();
  const { reloadLockups } = useLockups();

  const [showTxModal, setShowTxModal] = useState(false);
  const [modalLockup, setModalLockup] = useState(lockups[0]);

  if (!lockups) {
    return (
      <Card>
        <Loading />
      </Card>
    );
  }

  const handleUnlock = async (lockupId) => {
    const transaction = await contracts.OgvStaking["unstake(uint256)"](
      lockupId,
      { gasLimit: 1000000 }
    ); // @TODO maybe set this to lower

    useStore.setState({
      pendingTransactions: [
        ...pendingTransactions,
        {
          ...transaction,
          onComplete: () => {
            toast.success("Lockup unstaked", {
              hideProgressBar: true,
            });
            reloadTotalBalances();
            reloadAccountBalances();
            reloadLockups();
          },
        },
      ],
    });
  };

  return (
    <>
      <table className="table table-compact w-full mb-4">
        <thead>
          <tr>
            <th>OGV</th>
            <th>Time remaining</th>
            <th>Lockup ends</th>
            <th>veOGV</th>
          </tr>
        </thead>
        <tbody>
          {lockups.length > 0 &&
            lockups.map((lockup) => {
              return (
                <>
                  <tr key={`${lockup.lockupId}`}>
                    <td>
                      <TokenAmount amount={lockup.amount} />
                    </td>
                    <td>
                      <TimeToDate epoch={lockup.end} />
                    </td>
                    <td>{moment.unix(lockup.end).format("MMM D, YYYY")}</td>
                    <td>
                      <TokenAmount amount={lockup.points} />
                    </td>
                    <td>
                      <Link
                        className="btn rounded-full btn-sm btn-primary"
                        href={`/stake/${lockup.lockupId}`}
                      >
                        Extend
                      </Link>
                    </td>
                    <td>
                      <Button
                        white
                        small
                        disabled={blockTimestamp < lockup.end}
                        onClick={() => handleUnlock(lockup.lockupId)}
                      >
                        Unstake
                      </Button>
                    </td>
                    <td>
                      <button
                        className="flex-shrink-0 flex items-center justify-center w-4 p-0"
                        onClick={() => {
                          setModalLockup(lockup);
                          setShowTxModal(true);
                        }}
                      >
                        <EtherscanIcon />
                      </button>
                    </td>
                  </tr>
                </>
              );
            })}
        </tbody>
      </table>
      <Modal
        show={showTxModal}
        handleClose={() => setShowTxModal(false)}
        showCloseIcon
      >
        <h3 className="mb-4 text-lg">Transaction history</h3>
        <table className="table table-compact w-full">
          <thead>
            <tr>
              <th>Transaction time</th>
              <th>Event</th>
              <th>Transaction hash</th>
            </tr>
          </thead>
          <tbody>
            {modalLockup.transactions &&
              modalLockup.transactions.length > 0 &&
              modalLockup.transactions.map((transaction) => {
                return (
                  <tr key={transaction.hash}>
                    <td>
                      {moment(transaction.createdAt).format(
                        "MMM D, YYYY, HH:mm:ss"
                      )}
                    </td>
                    <td>{transaction.event}</td>
                    <td>
                      <Link
                        href={
                          chainId === 4
                            ? `https://rinkeby.etherscan.io/tx/${transaction.hash}`
                            : `https://etherscan.io/tx/${transaction.hash}`
                        }
                        newWindow
                      >
                        <span className="mr-2">
                          {truncateEthAddress(transaction.hash)}
                        </span>
                        <ExternalLinkIcon isGreen />
                      </Link>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </Modal>
    </>
  );
};

export default LockupsTable;
