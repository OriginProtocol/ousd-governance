import { useState } from "react";
import useLocalStorage from "utils/useLocalStorage";
import classnames from "classnames";

const GeoFenceCheck = () => {
  const { data: hasConfirmedGeoLocation, onSetItem } = useLocalStorage(
    "@originprotocol/governance-geo-check",
    false
  );

  const [isChecked, setIsChecked] = useState(false);

  const onAckGeoFence = () => {
    onSetItem(true);
  };

  return (
    <div
      className={classnames("modal mt-0", {
        "modal-open": !hasConfirmedGeoLocation,
      })}
    >
      <div className="flex flex-col geofence-modal">
        <header className="header">
          <h1 className="title">Restricted Access</h1>
        </header>
        <div className="body">
          <p className="info">
            Origin DeFi Governance is not available to restricted jurisdictions.
            Before proceeding, please carefully read the following:
          </p>
          <div className="accept-criteria">
            <ul className="accept-criteria-list">
              <li className="item">
                You confirm that you are not a resident of, citizen of, located
                in, incorporated in, or have a registered office in the United
                States or any country or region currently currently subject to
                sanctions by the United States.
              </li>
              <li className="item">
                You affirm that you are not a subject of economic or trade
                sanctions administered or enforced by any governmental authority
                or otherwise designated on any list of prohibited or restricted
                parties, including the list maintained by the Office of Foreign
                Assets Control of the U.S. Department of the Treasury.
              </li>
              <li className="item">
                You agree not to use any VPN or other privacy or anonymization
                tools or techniques to attempt to circumvent these eligibility
                restrictions.
              </li>
              <li className="item">
                You are lawfully permitted to access this site. You understand
                and accept the risks associated with using Origin DeFi
                Governance.
              </li>
            </ul>
          </div>
          <div className="ack">
            <label className="ack-label">
              <div className="ack-container">
                <input
                  className="ack-checkbox"
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    setIsChecked(e.target.checked);
                  }}
                />
              </div>

              <span className="ack-label-text">
                I have read and agree to the above terms{" "}
              </span>
            </label>
          </div>
        </div>
        <footer className="footer">
          <a className="footer-action" href="https://ousd.com">
            Exit
          </a>
          <button
            className="footer-action"
            onClick={onAckGeoFence}
            disabled={!isChecked}
          >
            I agree
          </button>
        </footer>
      </div>
    </div>
  );
};

export default GeoFenceCheck;
