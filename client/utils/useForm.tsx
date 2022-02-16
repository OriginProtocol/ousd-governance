import { useState } from "react";

export function isRequired(value) {
  return value != null && value.length > 0;
}

export function isAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export function isUint(value) {
  return /^[0-9]+$/.test(value);
}

export function isArray(value) {
  return Array.isArray(value);
}

export function isAddressArray(value) {
  return isArray(value) && value.every(isAddress);
}

export function isStringArray(value) {
  return isArray(value) && value.every((item) => typeof item === "string");
}

export function isUintArray(value) {
  return isArray(value) && value.every(isUint);
}

function validate(validations, values) {
  const errors = validations
    .map((validation) => validation(values))
    .filter((validation) => typeof validation === "object");

  return {
    isValid: errors.length === 0,
    errors: errors.reduce((errors, error) => ({ ...errors, ...error }), {}),
  };
}

export function useForm(
  initialState: object,
  validations: Array<Function>,
  onSubmit: Function
) {
  const { isValid: initialIsValid, errors: initialErrors } = validate(
    validations,
    initialState
  );
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState(initialErrors);
  const [isValid, setValid] = useState(initialIsValid);
  const [touched, setTouched] = useState({});

  const changeHandler = (event: any) => {
    const newValues = { ...values, [event.target.name]: event.target.value };
    const { isValid, errors } = validate(validations, newValues);
    setValues(newValues);
    setValid(isValid);
    setErrors(errors);
    setTouched({ ...touched, [event.target.name]: true });
  };

  const submitHandler = (event: any) => {
    event.preventDefault();
    onSubmit(values);
  };

  const reset = () => {
    setValues(initialState);
    setErrors(initialErrors);
    setValid(initialIsValid);
    setTouched({});
  };

  return {
    values,
    changeHandler,
    isValid,
    errors,
    touched,
    submitHandler,
    reset,
  };
}
