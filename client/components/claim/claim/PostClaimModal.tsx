import { FunctionComponent, Dispatch, SetStateAction } from "react";
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
import { mdiWallet, mdiLaunch, mdiArrowDown } from "@mdi/js";
import Image from "next/image";

interface PostClaimModalProps {
  show: Boolean;
  claim: Object;
  handleClose: Dispatch<SetStateAction<boolean>>;
  didLock?: Boolean;
  veOgv?: Number;
}

const PostClaimModalProps: FunctionComponent<PostClaimModalProps> = ({
  show,
  claim,
  handleClose,
  didLock,
  veOgv,
}) => {
  const { state, amount, receipt } = claim;

  return (
    <Modal show={show} handleClose={handleClose}>
      <div className="text-center">
        {"waiting-for-user" === state && (
          <div className="py-5 md:py-10 space-y-6">
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
        )}
        {"waiting-for-network" === state && (
          <div className="py-5 md:py-10 space-y-6">
            <Loading large />
            <div className="space-y-2">
              <h2 className="font-bold text-3xl">Processing transaction</h2>
              <p className="text-gray-500 text-lg">
                {didLock ? (
                  <>
                    Locking <TokenAmount amount={amount} /> OGV and claiming{" "}
                    <TokenAmount amount={veOgv} /> veOGV...
                  </>
                ) : (
                  <>
                    Claiming <TokenAmount amount={amount} /> OGV...
                  </>
                )}
              </p>
            </div>
            <Link
              newWindow
              href={`https://etherscan.io/tx/${receipt}`}
              className="inline-flex items-center space-x-1 text-sm hover:underline"
            >
              <span>View explorer</span>
              <Icon path={mdiLaunch} size={0.6} />
            </Link>
          </div>
        )}
        {"claimed" === state && (
          <div className="pt-1 -mb-6">
            <div className="space-y-6">
              <h2 className="font-bold text-3xl">Success!</h2>
              <div className="space-y-3">
                <CardGroup horizontal={didLock} twoCol={didLock}>
                  <div className="space-y-2 flex flex-col">
                    <span className="text-sm">
                      {didLock ? "You have locked" : "You have claimed"}
                    </span>
                    <Card noPadding noShadow alt>
                      <div className="flex justify-center p-2">
                        <div className="flex space-x-[0.4rem] items-end">
                          <TokenIcon large src="/ogv.svg" alt="OGV" />
                          <CardStat large>
                            <TokenAmount amount={amount} />
                          </CardStat>
                          <CardDescription large>OGV</CardDescription>
                        </div>
                      </div>
                    </Card>
                  </div>
                  {didLock && (
                    <div className="space-y-2 flex flex-col">
                      <span className="text-sm">You have claimed</span>
                      <Card noPadding noShadow alt>
                        <div className="flex justify-center p-2">
                          <div className="flex space-x-[0.4rem] items-end">
                            <TokenIcon large src="/veogv.svg" alt="veOGV" />
                            <CardStat large>
                              <TokenAmount amount={veOgv} />
                            </CardStat>
                            <CardDescription large>veOGV</CardDescription>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}
                </CardGroup>
                <Link
                  newWindow
                  href={`https://etherscan.io/tx/${receipt}`}
                  className="inline-flex items-center space-x-1 text-sm hover:underline"
                >
                  <span>View explorer</span>
                  <Icon path={mdiLaunch} size={0.6} />
                </Link>
              </div>
              <p className="text-xl pb-2">Next step...</p>
              <div className="bg-[#0075f0] text-white -m-10 pt-2 p-10 space-y-8 relative">
                <div className="absolute h-9 w-9 bg-secondary border border-white rounded-full left-1/2 -top-4 -ml-[19px]" />
                <div className="absolute h-9 w-9 left-1/2 -top-[41px] -ml-[12px]">
                  <Icon path={mdiArrowDown} size={0.9} className="text-white" />
                </div>
                <p className="text-xl">
                  ...<strong>earn ETH</strong> when you stake OGN on Origin
                  Story.
                </p>
                <Link
                  className="flex justify-center"
                  href="https://www.story.xyz/#/stake"
                >
                  <Image
                    width="243.6"
                    height="43.6"
                    src="/origin_story_logo_white.svg"
                    alt="Origin Story"
                  />
                </Link>
                <Link
                  href="https://www.story.xyz/#/stake"
                  className="btn rounded-full normal-case space-x-2 btn-lg h-[3.25rem] min-h-[3.25rem] w-full btn-primary bg-black text-white border-black hover:bg-gray-900 hover:border-gray-900"
                >
                  <span>Earn ETH rewards</span>
                  <Icon path={mdiLaunch} size={0.75} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PostClaimModalProps;
