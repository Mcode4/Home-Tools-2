import { Component } from "react";

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error("ErrorBoundary caught:", error, info);
    }

    render() {
        if (this.state.error) {
            return (
                <div style={{ padding: 40, fontFamily: "sans-serif" }}>
                    <h1>Something went wrong</h1>
                    <pre style={{ color: "red", whiteSpace: "pre-wrap" }}>
                        {this.state.error.toString()}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}
