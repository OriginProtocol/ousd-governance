import { FunctionComponent, ReactNode } from "react";
import Button from "components/Button";
import classNames from "classnames";

interface ModalProps {
  show: Boolean;
  handleClose?: () => void;
  children: ReactNode;
}

const Modal: FunctionComponent<ModalProps> = ({
  show,
  handleClose,
  children,
}) => {
  const className = classNames("modal", {
    "modal-open": show,
  });

  return (
    <div className={className} style={{ marginTop: 0 }}>
      <div className="modal-box bg-white">
        {children}
        {handleClose && <Button onClick={handleClose}>Close</Button>}
      </div>
    </div>
  );
};

export default Modal;
