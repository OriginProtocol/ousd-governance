import { useState, useEffect } from "react";
import {
  isUint,
  isAddress,
  isAddressArray,
  isRequired,
  useForm,
} from "utils/useForm";
import { useStore } from "utils/store";
import { truncateEthAddress } from "utils/index";

export const AddActionFunctionForm = ({
  abi,
  address,
  onSubmit,
  onModalClose,
  onPrevious,
  onContractChange,
  hasImplementationAbi,
}: {
  abi: Array<any>;
  address: string;
  onSubmit: Function;
  onModalClose: Function;
  onPrevious: Function;
  onContractChange: Function;
  hasImplementationAbi: boolean;
}) => {
  const { contracts } = useStore();
  const [signature, setSignature] = useState(null);

  const initialState = {
    signature: "",
    address,
    abi,
  };

  const contractFunctions = abi
    .filter(
      ({ type, stateMutability }: { type: string; stateMutability: string }) =>
        type === "function" && stateMutability.includes("payable")
    )
    .map(({ name, inputs }) => ({
      name,
      inputs,
      signature: `${name}(${inputs
        .map(({ type }: { type: string }) => type)
        .join(",")})`,
    }));

  const inputsForFunction = contractFunctions.find(
    (c) => c.signature === signature
  )?.inputs;

  const validations = [
    ({ address }: { address: string }) =>
      isRequired(address) || { address: "Contract address is required" },
    ({ abi }: { abi: string }) =>
      isRequired(abi) || { abi: "Contract ABI is required" },
    ({ signature }: { signature: string }) =>
      isRequired(signature) || {
        address: "Contract function is required",
      },
  ];

  if (inputsForFunction) {
    for (let i = 0; i < inputsForFunction.length; i++) {
      const { name, type } = inputsForFunction[i];
      validations.push(({ [name]: value }: { [name: string]: string }) => {
        if (type === "address") {
          return (
            isAddress(value) || {
              [name]: `${name} is not a valid address`,
            }
          );
        } else if (type.startsWith("uint")) {
          return (
            isUint(value) || {
              [name]: `${name} is not a valid number`,
            }
          );
        } else if (type == "address[]") {
          return (
            isAddressArray(value) || {
              [name]: `${name} is not a valid address array`,
            }
          );
        } else {
          return (
            isRequired(value) || {
              [name]: `${name} is required`,
            }
          );
        }
      });
    }
    for (let i = 0; i < inputsForFunction.length; i++) {
      const { name, type } = inputsForFunction[i];
      initialState[name] = "";
    }
  }

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
        onContractChange(contract);
      }
    }
  }, []);

  return (
    <form onSubmit={submitHandler}>
      {hasImplementationAbi && (
        <div className="form-control">
          <label className="label">
            <span className="label-text">Implementation contract</span>
          </label>
          <select
            name="address"
            className="select select-bordered w-full"
            onChange={changeHandler}
            defaultValue={values.address}
          >
            <option value="" disabled={true}>
              Select contract
            </option>
            {Object.entries(contracts).map(([name, contract]) => {
              return (
                <option key={contract.address} value={contract.address}>
                  {name} {truncateEthAddress(contract.address)}
                </option>
              );
            })}
          </select>
          {touched.address && errors.address && touched.signature && (
            <p className="mt-2 text-sm text-error-content">
              Please select a contract
            </p>
          )}
        </div>
      )}
      <div className="form-control w-full my-2">
        <label className="label">
          <span className="label-text">Function</span>
        </label>
        <select
          name="signature"
          className="select select-bordered w-full"
          onChange={(e) => {
            changeHandler(e);
            setSignature(e.target.value);
          }}
          defaultValue=""
        >
          <option value="" disabled={true}>
            Choose function
          </option>
          {contractFunctions &&
            contractFunctions.map(({ name, inputs, signature }) => (
              <option key={signature} value={signature}>
                {name}(
                {inputs.map(({ name, type }) => `${type} ${name}`).join(", ")})
              </option>
            ))}
        </select>
        {inputsForFunction && inputsForFunction.length > 0 && (
          <div className="form-control w-full mt-2">
            <label className="label">
              <span className="label-text">Inputs</span>
            </label>
            <div className="flex flex-wrap">
              {inputsForFunction.map(({ name, type }) => (
                <div className="w-full px-3 mb-3" key={name}>
                  <div>
                    <label className="label">
                      <span className="label-text">{name}</span>
                    </label>
                    <input
                      name={name}
                      className="input input-bordered input-sm w-full"
                      type="text"
                      onChange={changeHandler}
                      placeholder={type}
                    />
                    {touched[name] && errors[name] && (
                      <p className="mt-1 text-sm text-error-content">
                        {errors[name]}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="modal-action">
        <button
          className="btn btn-secondary mr-auto"
          onClick={() => {
            reset();
            onPrevious();
          }}
        >
          Back
        </button>
        <button className="btn btn-primary" type="submit" disabled={!isValid}>
          Done
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
