import { useMemo } from "react";
import { useStore } from "utils/store";

const AdminUtils = () => {
  const show = useMemo(() => {
    if (process.browser) {
      if (localStorage.getItem("admin") === "true") {
        return true;
      }
    }
    return false;
  }, [process.browser]);

  const setClaimsOpenTs = (claimOpensTs) => {
    useStore.setState({
      claim: {
        ...useStore.getState().claim,
        claimOpensTs,
      },
    });
  };

  const skipEducation = () => {
    useStore.setState({
      claim: {
        ...useStore.getState().claim,
        currentStep: 2,
      },
    });
  };

  const buttonClass = "px-2 py-1 my-1 border border-black rounded-md";
  return (
    show && (
      <div className="fixed w-34 bottom-0 right-0 bg-gray-300 flex flex-col justify-center">
        <button
          className={buttonClass}
          onClick={() => {
            setClaimsOpenTs(1);
          }}
        >
          Open claims
        </button>
        <button
          className={buttonClass}
          onClick={() => {
            setClaimsOpenTs(Date.now() / 1000 + 5);
          }}
        >
          Open claims in 5s
        </button>
        <button
          className={buttonClass}
          onClick={() => {
            setClaimsOpenTs(process.env.CLAIM_OPENS);
          }}
        >
          Reset Open Claims
        </button>
        <button className={buttonClass} onClick={skipEducation}>
          Skip Education
        </button>
      </div>
    )
  );
};

export default AdminUtils;
