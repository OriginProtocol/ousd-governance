import { FunctionComponent } from "react";
import Card from "components/Card";
import { SectionTitle } from "components/SectionTitle";
import { mdiCheck, mdiOpenInNew } from "@mdi/js";
import moment from "moment";
import classNames from "classnames";
import { useStore } from "utils/store";
import Link from "components/Link";
import Icon from "@mdi/react";

interface ProposalHistoryProps {
  transactions: Array<object>;
}

const ProposalHistory: FunctionComponent<ProposalHistoryProps> = ({
  transactions,
}) => {
  const { rpcProvider } = useStore();

  let explorerPrefix;
  if (rpcProvider?._network?.chainId === 1) {
    explorerPrefix = "https://etherscan.io/";
  } else if (rpcProvider?._network?.chainId === 5) {
    explorerPrefix = "https://goerli.etherscan.io/";
  }

  return (
    <Card>
      <SectionTitle>Proposal History</SectionTitle>
      <ul className="space-y-5">
        {transactions.map((transaction) => {
          const isGrey =
            transaction.event !== "Succeeded" &&
            transaction.event !== "Queued" &&
            transaction.event !== "Executed";

          const iconClasses = classNames(
            "h-7 w-7 rounded-full text-white flex items-center justify-center",
            {
              "bg-gray-500": isGrey,
              "bg-success": !isGrey,
            }
          );

          return (
            <li
              key={`${transaction.event}-${transaction.createdAt}`}
              className="flex space-x-4 items-center"
            >
              <span className={iconClasses}>
                <Icon path={mdiCheck} size={0.8} />
              </span>
              <div>
                <div className="flex items-center space-x-1">
                  <h3 className="text-sm">{transaction.event}</h3>
                  {explorerPrefix && transaction.hash && (
                    <Link
                      className="text-neutral"
                      href={`${explorerPrefix}tx/${transaction.hash}`}
                      newWindow
                    >
                      <Icon path={mdiOpenInNew} size={0.6} />
                    </Link>
                  )}
                </div>
                <p className="text-neutral text-xs">
                  {moment(transaction.createdAt).format(
                    "MMM D, YYYY, HH:mm:ss"
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
};

export { ProposalHistory };
