import { FunctionComponent, ReactNode, Dispatch, SetStateAction } from "react";
import classNames from "classnames";

interface ModalProps {
  show: Boolean;
  handleClose?: Dispatch<SetStateAction<boolean>>;
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
    <div className={className} style={{ marginTop: 0 }} onClick={handleClose}>
      <div className="modal-box overflow-hidden bg-white">{children}</div>
    </div>
  );
};

export default Modal;
