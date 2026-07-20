import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { thunkLogin } from "../../redux/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginFormPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [err, setErr] = useState({});
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr({});
        setLoading(true);
        try {
            const user = await dispatch(thunkLogin({ email, password }));
            if (user.success) {
                navigate("/dashboard");
            } else {
                setErr({ server: String(user.detail || "Invalid credentials") });
            }
        } catch (err) {
            if (err.status === 404) {
                setErr({ server: "No account found with this email" });
            } else if (err.status === 401) {
                setErr({ server: "Invalid password" });
            } else {
                setErr({ server: err.message || "Server error, please try again" });
            }
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
                    <h2 className="text-xl font-semibold text-foreground mb-2">Design in 3D</h2>
                    <p className="text-sm text-muted-foreground">
                        Draw floorplans, furnish rooms, and visualize in 3D — all in one tool.
                    </p>
                </div>
            </div>

            {/* Right: Form */}
            <div className="flex flex-1 items-center justify-center p-6">
                <Card className="w-full max-w-sm">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Welcome Back</CardTitle>
                        <CardDescription>Sign in to Home Tools</CardDescription>
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
                                    type="text"
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
                                        placeholder="Enter your password"
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

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Signing in..." : "Log In"}
                            </Button>

                            <p className="text-center text-sm text-muted-foreground">
                                Don't have an account?{" "}
                                <button
                                    type="button"
                                    onClick={() => navigate("/signup")}
                                    className="text-primary hover:underline underline-offset-4"
                                >
                                    Sign up
                                </button>
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
