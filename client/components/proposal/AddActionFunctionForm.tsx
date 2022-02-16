import { useState, useEffect } from "react";
import {
  isUint,
  isAddress,
  isAddressArray,
  isRequired,
  useForm,
} from "utils/useForm";
import { contracts } from "constants/index";
import { truncateEthAddress } from "utils/index";

export const AddActionFunctionForm = ({
  abi,
  onSubmit,
  onModalClose,
  onPrevious,
}) => {
  const [contractFunction, setContractFunction] = useState(null);

  const contractFunctions = abi.filter(
    ({ type, stateMutability }) =>
      type === "function" && stateMutability.includes("payable")
  );

  const inputsForFunction =
    contractFunctions &&
    contractFunctions.find(({ name }) => name === contractFunction)?.inputs;

  const initialState = {
    contractFunction: "",
  };

  const validations = [
    ({ contractFunction }: { contractFunction: string }) =>
      isRequired(contractFunction) || {
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
        } else if (type == "addresss[]") {
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

  return (
    <form onSubmit={submitHandler}>
      <div className="form-control w-full my-2">
        <label className="label">
          <span className="label-text">Function</span>
        </label>
        <select
          name="contractFunction"
          className="select select-bordered w-full"
          onChange={(e) => {
            changeHandler(e);
            setContractFunction(e.target.value);
          }}
          defaultValue=""
        >
          <option value="" disabled={true}>
            Choose function
          </option>
          {contractFunctions &&
            contractFunctions.map(({ name, inputs }) => (
              <option key={name + inputs} value={name}>
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
                <>
                  <div className="w-full px-3 mb-3" key={name}>
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
                      <p className="mt-1 text-sm text-error">{errors[name]}</p>
                    )}
                  </div>
                </>
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
        <button onClick={onModalClose} className="btn">
          Close
        </button>
      </div>
    </form>
  );
};
