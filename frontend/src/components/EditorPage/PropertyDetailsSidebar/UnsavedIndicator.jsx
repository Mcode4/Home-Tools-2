import "./UnsavedIndicator.css";

export default function UnsavedIndicator() {
    return (
        <div className="unsaved-dot-container">
            <div className="unsaved-dot" />
            <div className="unsaved-dot-pulse" />
        </div>
    );
}
