import React from "react";

export const useStickyState = (defaultValue, key) => {
  const [value, setValue] = React.useState(defaultValue);

  React.useEffect(() => {
    const stickyValue = window.localStorage.getItem(key);
    if (stickyValue) {
      setValue(JSON.parse(stickyValue));
    }
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
};
