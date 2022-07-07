import { FunctionComponent } from "react";
import Modal from "components/Modal";
import { Loading } from "components/Loading";
import Link from "components/Link";
import CardGroup from "components/CardGroup";
import Card from "components/Card";
import TokenIcon from "components/TokenIcon";
import CardStat from "components/CardStat";
import TokenAmount from "components/TokenAmount";
import CardDescription from "components/CardDescription";
import Icon from "@mdi/react";
import { mdiWallet, mdiLaunch } from "@mdi/js";

interface PostClaimModalProps {
  show: Boolean;
}

const PostClaimModalProps: FunctionComponent<PostClaimModalProps> = ({
  show,
}) => {
  return (
    <Modal show={show}>
      <div className="text-center py-6 sm:py-12">
        <div className="space-y-6">
          <Icon path={mdiWallet} size={3} className="text-accent mx-auto" />
          <div className="space-y-2">
            <h2 className="font-bold text-3xl">
              Confirm transaction in wallet
            </h2>
            <p className="text-gray-500 text-lg">
              Approve the transaction to lock and claim your tokens
            </p>
          </div>
          <p className="text-gray-500 text-sm">
            Please check your wallet and approve the transactions
          </p>
        </div>
        <div className="space-y-6">
          <Loading large />
          <div className="space-y-2">
            <h2 className="font-bold text-3xl">Processing transaction</h2>
            <p className="text-gray-500 text-lg">
              Locking up 75 OGV and claiming 787 veOGV...
            </p>
          </div>
          <Link
            newWindow
            href="https://etherscan.io"
            className="inline-flex items-center space-x-1 text-sm hover:underline"
          >
            <span>View explorer</span>
            <Icon path={mdiLaunch} size={0.6} />
          </Link>
        </div>
        <div className="space-y-6">
          <h2 className="font-bold text-3xl">Success!</h2>
          <CardGroup>
            <div className="space-y-2 flex flex-col">
              <span className="text-sm">You are claiming</span>
              <Card tightPadding noShadow>
                <div className="flex">
                  <div className="flex space-x-[0.4rem] items-end">
                    <TokenIcon large src="/ogv.svg" alt="OGV" />
                    <CardStat large>
                      <TokenAmount amount={10} />
                    </CardStat>
                    <CardDescription large>OGV</CardDescription>
                  </div>
                </div>
              </Card>
            </div>
          </CardGroup>
        </div>
      </div>
    </Modal>
  );
};

export default PostClaimModalProps;
