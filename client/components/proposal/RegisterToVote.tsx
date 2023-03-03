import { FunctionComponent, useState } from "react";
import Button from "components/Button";
import { useStore } from "utils/store";
import useShowDelegationModalOption from "utils/useShowDelegationModalOption";
import { toast } from "react-toastify";
import Card from "components/Card";
import Link from "components/Link";
import classNames from "classnames";
import { useWeb3React } from "@web3-react/core";

interface RegisterToVoteProps {
  withCard?: Boolean;
  singleView?: Boolean;
  whiteRegisterCta?: Boolean;
  // show error message when user has no veOgv yet and hasn't delegated
  showNoVeOgvMessage?: Boolean;
}

const RegisterToVote: FunctionComponent<RegisterToVoteProps> = ({
  withCard,
  singleView,
  showNoVeOgvMessage,
  whiteRegisterCta,
}) => {
  const { contracts, balances, pendingTransactions } = useStore();
  const { account: address } = useWeb3React();
  const { veOgv } = balances;
  const { library, account } = useWeb3React();

  const [registerStatus, setRegisterStatus] = useState("ready");
  const { needToShowDelegation } = useShowDelegationModalOption();

  let registerButtonText = "";
  if (registerStatus === "ready") {
    registerButtonText = "Register to Vote";
  } else if (registerStatus === "waiting-for-user") {
    registerButtonText = "Confirm transaction";
  } else if (registerStatus === "waiting-for-network") {
    registerButtonText = "Waiting to be mined";
  }

  const handleRegistration = async () => {
    setRegisterStatus("waiting-for-user");
    try {
      const transaction = await contracts.OgvStaking.connect(
        library.getSigner(account)
      ).delegate(address);
      setRegisterStatus("waiting-for-network");

      useStore.setState({
        pendingTransactions: [
          ...pendingTransactions,
          {
            ...transaction,
            onComplete: () => {
              toast.success("You've registered to vote", {
                hideProgressBar: true,
              }),
                setRegisterStatus("ready");
              useStore.setState({ ogvDelegateeAddress: address });
            },
          },
        ],
      });
    } catch (e) {
      setRegisterStatus("ready");
    }
  };

  const hasTokensButUnregistered = veOgv.gt(0) && needToShowDelegation;
  const hasNoTokensAndUnregistered = veOgv.eq(0) && needToShowDelegation;
  console.log("whiteRegisterCta", whiteRegisterCta, !whiteRegisterCta);
  const classes = classNames(
    "bg-accent text-white -my-10 -mx-6 p-10 md:-mx-10",
    {
      "bg-accent text-white": !whiteRegisterCta,
      "bg-white text-black": whiteRegisterCta,
    }
  );

  const RegisterCta = () => (
    <div className={!withCard ? "mb-20" : ""}>
      <div className={classes}>
        <h2 className="text-lg font-bold mb-2">Governance Information</h2>
        <p className="mb-4">
          {singleView && (
            <>
              Sorry, you weren&apos;t registered in time to vote on this
              proposal.
            </>
          )}{" "}
          Please register to participate in governance for future proposals. You
          won&apos;t be able to vote on a proposal with your veOGV until you do.
        </p>
        <Button
          white
          large
          onClick={handleRegistration}
          disabled={registerStatus !== "ready"}
        >
          {registerButtonText}
        </Button>
      </div>
    </div>
  );

  const VeOgvMessage = () => (
    <div className={!withCard ? "mb-20" : ""}>
      <div className="bg-white -my-10 -mx-6 p-10 md:-mx-10">
        <h2 className="text-lg font-bold mb-2">Stake OGV</h2>
        <p className="mb-8">
          First stake some OGV and gain veOGV to be eligible for voting
        </p>
        <Link
          className="btn rounded-full normal-case space-x-2 btn-lg h-[3.25rem] min-h-[3.25rem] min-w-[10.25rem] btn-primary"
          href="/stake"
        >
          Stake
        </Link>
      </div>
    </div>
  );

  if (showNoVeOgvMessage && hasNoTokensAndUnregistered) {
    return (
      <Card>
        <VeOgvMessage />
      </Card>
    );
  }

  if (!hasTokensButUnregistered) {
    return null;
  }

  if (withCard) {
    return (
      <Card>
        <RegisterCta />
      </Card>
    );
  }

  return <RegisterCta />;
};

export default RegisterToVote;
