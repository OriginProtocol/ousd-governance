import { useState, useEffect } from "react";
import { isRequired, useForm } from "utils/useForm";
import { contracts } from "constants/index";
import { truncateEthAddress } from "utils/index";

export const AddActionContractForm = ({ onSubmit, onModalClose }) => {
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
      const contract = contracts.find((c) => c.address === values.address);
      if (contract) {
        changeHandler({
          target: {
            name: "abi",
            value: contract.abi,
          },
        });
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
                <p className="mt-2 text-sm text-error">{errors.address}</p>
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
                <p className="mt-2 text-sm text-error">{errors.abi}</p>
              )}
            </div>
          </>
        ) : (
          contracts && (
            <div className="form-control">
              <label className="label">
                <span className="label-text">Select contract</span>
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
                {contracts.map(({ name, address }) => (
                  <option key={address} value={address}>
                    {name} {truncateEthAddress(address)}
                  </option>
                ))}
              </select>
              {touched.address && errors.address && (
                <p className="mt-2 text-sm text-error">
                  Please select a contract
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
        <button className="btn btn-primary" type="submit" disabled={!isValid}>
          Next
        </button>
        <button onClick={onModalClose} className="btn">
          Close
        </button>
      </div>
    </form>
  );
};
