import { FunctionComponent, ReactNode, Dispatch, SetStateAction } from "react";
import classNames from "classnames";
import CrossIcon from "components/CrossIcon";

interface ModalProps {
  show: Boolean;
  handleClose?: Dispatch<SetStateAction<boolean>>;
  children: ReactNode;
  showCloseIcon?: Boolean;
}

const Modal: FunctionComponent<ModalProps> = ({
  show,
  handleClose,
  children,
  showCloseIcon,
}) => {
  const className = classNames("modal", {
    "modal-open": show,
  });

  return (
    <div className={className} style={{ marginTop: 0 }} onClick={handleClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-box overflow-hidden bg-secondary text-white"
      >
        {showCloseIcon && handleClose && (
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 w-4 hover:opacity-80"
          >
            <CrossIcon />
          </button>
        )}
        {children}
      </div>
    </div>
  );
};

export default Modal;
