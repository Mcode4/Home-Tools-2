import "./UnsavedIndicator.css";

export default function UnsavedIndicator({ pulseOnly = false }) {
    return (
        <div className="unsaved-dot-container">
            {!pulseOnly && <div className="unsaved-dot" />}
            <div className="unsaved-dot-pulse" />
        </div>
    );
}
