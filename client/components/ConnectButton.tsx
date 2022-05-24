import { FunctionComponent } from "react";
import { ConnectButton as RainbowConnectButton } from "@rainbow-me/rainbowkit";

const ConnectButton: FunctionComponent = () => (
  <RainbowConnectButton
    accountStatus="address"
    chainStatus="none"
    label="Connect"
    showBalance={false}
  />
);

export default ConnectButton;
