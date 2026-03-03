import { useModal } from "./Modal";
import "./Modal.css"

export function ModalButton({
    modalComponent,
    itemText,
    onItemClick,
    onModalClose,
    itemClass = "modal-item"
}) {
    const { setModalContent, setOnModalClose } = useModal();

    const onClick = () => {
        if (onModalClose) setOnModalClose(onModalClose);
        setModalContent(modalComponent);
        if(typeof onItemClick === "function") onItemClick();
    }

    return (
        <button id="base-modal-button" className={itemClass} onClick={onClick}>{itemText}</button>
    )
}

export function ModalItem({
    modalComponent,
    itemText,
    onItemClick,
    onModalClose,
    itemClass = "modal-item"
}) {
    const { setModalContent, setOnModalClose } = useModal();

    const onClick = () => {
        if (onModalClose) setOnModalClose(onModalClose);
        setModalContent(modalComponent);
        if(typeof onItemClick === "function") onItemClick();
    }

    return (
        <li id="base-modal-button" className={itemClass} onClick={onClick}>{itemText}</li>
    )
}