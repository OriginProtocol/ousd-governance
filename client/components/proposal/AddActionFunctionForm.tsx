import { useState, useEffect } from "react";
import { isRequired, useForm } from "utils/useForm";
import { contracts } from "constants/index";
import { truncateEthAddress } from "utils/index";

export const AddActionFunctionForm = ({
  abi,
  onSubmit,
  onModalClose,
  onPrevious,
}) => {
  const contractFunctions = abi.filter(
    ({ type, stateMutability }) =>
      type === "function" && stateMutability.includes("payable")
  );

  console.log(inputsForFunction);

  const initialState = {
    contractFunction: "",
    ...(contractFunctions &&
      contractFunctions.reduce(
        (acc, { name }) => ({ ...acc, [name]: "" }),
        {}
      )),
  };
  const validations = [
    ({ contractFunction }: { contractFunction: string }) =>
      isRequired(contractFunction) || {
        address: "Contract function is required",
      },
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

  const inputsForFunction =
    contractFunctions &&
    contractFunctions.find(({ name }) => name === values.contractFunction)
      ?.inputs;

  return (
    <form onSubmit={submitHandler}>
      <div className="form-control w-full my-2">
        <label className="label">
          <span className="label-text">Function</span>
        </label>
        <select
          name="contractFunction"
          className="select select-bordered w-full"
          onChange={changeHandler}
          defaultValue=""
        >
          <option value="" disabled={true}>
            Choose function
          </option>
          {contractFunctions &&
            contractFunctions.map(({ name, inputs }) => (
              <option key={name} value={name}>
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
                  <label className="label">
                    <span className="label-text">{name}</span>
                  </label>
                  <input
                    className="input input-bordered input-sm w-full"
                    type="text"
                    placeholder={type}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="modal-action">
        <button className="btn btn-secondary mr-auto" onClick={onPrevious}>
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
