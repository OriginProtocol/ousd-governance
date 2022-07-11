import { FunctionComponent, Dispatch, SetStateAction, useEffect } from "react";
import Modal from "components/Modal";
import TokenIcon from "components/TokenIcon";
import { useStore } from "utils/store";
import MetamaskIcon from "components/MetamaskIcon";
import { mdiWallet, mdiLaunch, mdiArrowRight } from "@mdi/js";
import Image from "next/image";
import Icon from "@mdi/react";
import Button from "components/Button";
import { trackOGVInMetaMask, trackVeOGVInMetaMask } from "utils";

interface TokenToMetamaskModalProps {
  show: Boolean;
  tokenType: string; // either OGV or veOGV
  handleClose: Dispatch<SetStateAction<boolean>>;
}

const TokenToMetamaskModal: FunctionComponent<TokenToMetamaskModalProps> = ({
  show,
  tokenType,
  handleClose,
}) => {
  const {ogv, veOgv} = useStore().balances;
  const isOGV = tokenType === 'OGV';
  const token = isOGV ? ogv : veOgv;
  const localStorageKey = `${isOGV ? 'ogv' : 'veOgv'}-metamask-modal-shown`;

  useEffect(() => {
    const showModalCheck = () => {
      console.log("TOKEN", token, token.gt(0))
      if (!process.browser) {
        return;
      }
    };
    showModalCheck();
  }, [token])

  if (!["OGV, veOGV"].includes(tokenType)) {
    throw new Error(`Unexpected token type: ${tokenType}`);
  }

  return (
    <Modal show={show} handleClose={handleClose}>
      <div className="text-center py-4">
        <h2 className="font-bold text-3xl">Track OGV balance in Metamask</h2>
        <div className="flex justify-center space-x-2 my-8">
          <TokenIcon src="/ogv.svg" alt="OGV" large={true}/>
          <Icon path={mdiArrowRight} size={2} />
          <MetamaskIcon large={true}/>
        </div>
        <Button onClick={() => {
          trackOGVInMetaMask("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")
        }}>
          Add to Metamask
        </Button>
      </div>
    </Modal>
  );
};

export default TokenToMetamaskModal;
