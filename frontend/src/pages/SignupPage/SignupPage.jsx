import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { thunkSignup } from "../../redux/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SignupFormPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [err, setErr] = useState({});
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr({});
        const SYMBOL = "!@#$%?.-";
        const ALLOWED = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789${SYMBOL}`;

        if (confirmPwd !== password) {
            return setErr({ server: "Passwords don't match" });
        }

        if (password.length < 8 || password.length > 25) {
            return setErr({ server: "Password must be 8-25 characters" });
        }

        let symbolCheck = false;
        let upperCaseCheck = false;
        let numberCheck = false;

        for (let i = 0; i < password.length; i++) {
            if (!ALLOWED.includes(password[i])) {
                return setErr({
                    server: "Password contains characters not allowed. Only A-Z, 0-9, and " + SYMBOL
                });
            }
            if (isFinite(Number(password[i]))) numberCheck = true;
            if ("ABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(password[i])) upperCaseCheck = true;
            if (SYMBOL.includes(password[i])) symbolCheck = true;
        }

        if (!symbolCheck || !upperCaseCheck || !numberCheck) {
            return setErr({
                server: `Password must contain at least 1 uppercase, 1 number, and 1 special character: ${SYMBOL}`
            });
        }

        setLoading(true);
        try {
            const signup = await dispatch(thunkSignup({ email, password }));
            if (signup.success) {
                navigate("/");
            } else {
                setErr({ server: signup.detail || "Sign up failed" });
            }
        } catch (e) {
            setErr({ server: String(e) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-b from-background to-muted/30">
            {/* Left: Illustration */}
            <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-muted/20 p-12">
                <div className="max-w-sm text-center">
                    <svg viewBox="0 0 200 200" className="w-64 h-64 mx-auto mb-6 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="20" y="80" width="160" height="100" rx="4" />
                        <polygon points="100,20 180,80 20,80" />
                        <rect x="70" y="120" width="60" height="60" rx="2" />
                        <rect x="40" y="100" width="20" height="40" rx="2" />
                        <rect x="140" y="100" width="20" height="40" rx="2" />
                    </svg>
                    <h2 className="text-xl font-semibold text-foreground mb-2">Build Your Space</h2>
                    <p className="text-sm text-muted-foreground">
                        Create floorplans, add furniture, and explore in 3D.
                    </p>
                </div>
            </div>

            {/* Right: Form */}
            <div className="flex flex-1 items-center justify-center p-6">
                <Card className="w-full max-w-sm">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Create Account</CardTitle>
                        <CardDescription>Get started with Home Tools</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {err.server && (
                                <Alert variant="destructive">
                                    <AlertDescription>{err.server}</AlertDescription>
                                </Alert>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Create a password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? "🙈" : "👁"}
                                    </button>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="confirmPwd">Confirm Password</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPwd"
                                        type={showConfirm ? "text" : "password"}
                                        value={confirmPwd}
                                        onChange={(e) => setConfirmPwd(e.target.value)}
                                        placeholder="Confirm your password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm"
                                        tabIndex={-1}
                                    >
                                        {showConfirm ? "🙈" : "👁"}
                                    </button>
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Creating account..." : "Create Account"}
                            </Button>

                            <p className="text-center text-sm text-muted-foreground">
                                Already have an account?{" "}
                                <button
                                    type="button"
                                    onClick={() => navigate("/login")}
                                    className="text-primary hover:underline underline-offset-4"
                                >
                                    Log in
                                </button>
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
