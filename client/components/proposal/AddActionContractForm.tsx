import { useState, useEffect } from "react";
import { isRequired, useForm } from "utils/useForm";
import { truncateEthAddress } from "utils/index";
import { Loading } from "../Loading";
import { useStore } from "utils/store";

export const AddActionContractForm = ({
  onChange,
  onSubmit,
  onModalClose,
  fetchingProxy,
  isProxy,
  hasImplementationAbi,
  implementationAddress,
}: {
  onChange: Function;
  onSubmit: Function;
  onModalClose: Function;
  fetchingProxy: boolean;
  isProxy: boolean;
  hasImplementationAbi: boolean;
  implementationAddress: string;
}) => {
  const { contracts } = useStore();
  const [isCustomContract, setIsCustomContract] = useState(false);
  const initialState = {
    address: "",
    abi: "",
  };

  const validations = [
    ({ address }: { address: string }) =>
      isRequired(address) || { address: "Contract address is required" },
    ({ abi }: { abi: string }) =>
      isRequired(abi) || { abi: "Contract ABI is required" },
  ];
  const {
    values,
    isValid,
    errors,
    touched,
    changeHandler,
    submitHandler,
    reset,
  } = useForm(initialState, validations, onSubmit);

  useEffect(() => {
    if (values.address.length === 42) {
      const contract = Object.values(contracts).find(
        (c) => c.address === values.address
      );

      if (contract) {
        changeHandler({
          target: {
            name: "abi",
            value: contract.abi,
          },
        });
        onChange(contract);
      }
    }
  }, [values.address]);

  useEffect(reset, [isCustomContract]);
  return (
    <form onSubmit={submitHandler}>
      <div className="py-4">
        {isCustomContract ? (
          <>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Contract address</span>
              </label>
              <input
                name="address"
                type="text"
                placeholder="Contract address"
                className="input input-bordered"
                value={values.address}
                onChange={changeHandler}
              />
              {touched.address && errors.address && (
                <p className="mt-2 text-sm text-error-content">
                  {errors.address}
                </p>
              )}
            </div>
            <div className="form-control w-full mt-2">
              <label className="label">
                <span className="label-text">ABI</span>
              </label>
              <textarea
                name="abi"
                className="textarea h-24 textarea-bordered"
                placeholder="ABI"
                value={values.abi}
                onChange={changeHandler}
              ></textarea>
              {touched.abi && errors.abi && (
                <p className="mt-2 text-sm text-error-content">{errors.abi}</p>
              )}
            </div>
          </>
        ) : (
          contracts &&
          contracts.loaded && (
            <div className="form-control">
              <label className="label">
                <span className="label-text">Select contract</span>
                {fetchingProxy && <Loading small />}
              </label>
              <select
                name="address"
                className="select select-bordered w-full"
                onChange={changeHandler}
                defaultValue=""
              >
                <option value="" disabled={true}>
                  Select contract
                </option>
                {Object.entries(contracts)
                  .filter(([name, contract]) => typeof contract === "object")
                  .map(([name, contract]) => (
                    <option
                      key={`${name}-${contract.address}`}
                      value={contract.address}
                    >
                      {name} {truncateEthAddress(contract.address)}
                    </option>
                  ))}
              </select>
              {touched.address && errors.address && (
                <p className="mt-2 text-sm text-error-content">
                  Please select a contract
                </p>
              )}
              {!fetchingProxy && isProxy && !hasImplementationAbi && (
                <p className="mt-2 text-sm text-error-content">
                  Contract is proxy but no implementation found for{" "}
                  {truncateEthAddress(implementationAddress)}
                </p>
              )}
            </div>
          )
        )}
      </div>
      <div className="divider">Or</div>
      <div className="text-center py-4">
        {isCustomContract ? (
          <a
            href="#"
            className="link link-primary"
            onClick={() => setIsCustomContract(false)}
          >
            Select from known contracts
          </a>
        ) : (
          <a
            href="#"
            className="link link-primary"
            onClick={() => setIsCustomContract(true)}
          >
            Enter address and ABI manually
          </a>
        )}
      </div>
      <div className="modal-action">
        <button
          className="btn btn-primary"
          type="submit"
          disabled={!isValid || fetchingProxy}
        >
          Next
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            onModalClose();
          }}
          className="btn"
        >
          Close
        </button>
      </div>
    </form>
  );
};
