import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const features = [
    { icon: "📐", title: "Floorplan Editor", desc: "Draw outlines, divide rooms, place furniture" },
    { icon: "🌍", title: "Map Integration", desc: "Pin properties on interactive maps" },
    { icon: "🏗️", title: "3D Visualization", desc: "Preview and export as GLTF" },
];

export default function HomePage() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted/30 p-8">
            <Card className="max-w-md w-full mb-8">
                <CardHeader className="text-center pb-2">
                    <span className="text-4xl mb-2">🏠</span>
                    <CardTitle className="text-3xl font-bold">Home Tools</CardTitle>
                    <CardDescription className="text-base mt-1">
                        Professional floorplan design and 3D visualization
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 px-8 pb-8">
                    <Button
                        className="w-full h-12 text-base"
                        size="lg"
                        onClick={() => navigate("/login")}
                    >
                        Get Started
                    </Button>
                    <Button
                        className="w-full h-12 text-base"
                        variant="outline"
                        size="lg"
                        onClick={() => navigate("/signup")}
                    >
                        Create Account
                    </Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
                {features.map((f, i) => (
                    <Card key={i} className="text-center p-4">
                        <span className="text-2xl">{f.icon}</span>
                        <h3 className="font-semibold text-sm mt-2">{f.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
                    </Card>
                ))}
            </div>
        </div>
    );
}
