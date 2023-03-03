import { useRouter } from "next/router";
import { utils } from "ethers";

export function useOverrideAccount() {
  const {
    query: { override_account },
    pathname,
  } = useRouter();

  const isValid =
    override_account && !utils.isAddress(override_account as string)
      ? false
      : true;
  const overrideAccount =
    pathname === "/history" && override_account && isValid
      ? override_account
      : null;

  return { overrideAccount: overrideAccount, isValid: isValid };
}
