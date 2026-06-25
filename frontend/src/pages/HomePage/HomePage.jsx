import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
    const navigate = useNavigate();

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-6">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl">Home Tools</CardTitle>
                    <CardDescription>
                        Professional floorplan design and 3D visualization
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <Button
                        className="w-full"
                        size="lg"
                        onClick={() => navigate("/login")}
                    >
                        Get Started
                    </Button>
                    <Button
                        className="w-full"
                        variant="outline"
                        size="lg"
                        onClick={() => navigate("/dashboard")}
                    >
                        Dashboard
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
