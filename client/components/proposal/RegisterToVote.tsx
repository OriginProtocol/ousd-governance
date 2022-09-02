import { FunctionComponent, useState } from "react";
import Button from "components/Button";
import { useStore } from "utils/store";
import useShowDelegationModalOption from "utils/useShowDelegationModalOption";
import { toast } from "react-toastify";
import Card from "components/Card";

interface RegisterToVoteProps {
  withCard?: Boolean;
}

const RegisterToVote: FunctionComponent<RegisterToVoteProps> = ({
  withCard,
}) => {
  const { contracts, address, balances, pendingTransactions } = useStore();
  const { veOgv } = balances;
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
      const transaction = await contracts.OgvStaking.delegate(address);
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

  const RegisterCta = () => (
    <div className={!withCard ? "mb-20" : ""}>
      <div className="bg-accent text-white -my-10 -mx-6 p-10 md:-mx-10">
        <h2 className="text-lg font-bold mb-2">Governance Information</h2>
        <p className="mb-4">
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

  if (!hasTokensButUnregistered) return null;

  if (withCard) {
    <Card>
      <RegisterCta />
    </Card>;
  }

  return <RegisterCta />;
};

export default RegisterToVote;
