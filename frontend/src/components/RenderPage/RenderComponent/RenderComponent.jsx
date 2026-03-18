import { useState, useEffect, useRef } from "react";
import { Stage, Layer, Rect } from "react-konva";
import "./RenderComponent.css";

export default function RenderComponent() {
    const containerRef = useRef(null);

    const [size, setSize] = useState({width: 0, height: 0});
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({x: 0, y: 0});
    const [baseplateSize, setBaseplateSize] = useState({width: 800, height: 600});

    const MIN_SCALE = 0.5;
    const MAX_SCALE = 3;

    useEffect(()=> {
        const updateSize = () => {
            if(!containerRef.current) return;
            const { offsetWidth, offsetHeight } = containerRef.current;
            setSize({
                width: offsetWidth,
                height: offsetHeight
            });
        }
        updateSize();

        const resizeObserver = new ResizeObserver(updateSize);
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    const handleWheel = (e) => {
        e.evt.preventDefault();

        const scaleBy = 1.05;
        const oldScale = scale;

        const mousePointTo = {
            x: (e.evt.offsetX - position.x) / oldScale,
            y: (e.evt.offsetY - position.y) / oldScale
        }

        let newScale =
            e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

        newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

        const newPos = {
            x: e.evt.offsetX - mousePointTo.x * newScale,
            y: e.evt.offsetY - mousePointTo.y * newScale
        }

        setScale(newScale);
        setPosition(newPos);
    }

    return (
        <div id="render-component" ref={containerRef}>
            {size.width > 0 && (
                <Stage 
                    width={size.width} 
                    height={size.height}
                    scaleX={scale}
                    scaleY={scale}
                    x={position.x}
                    y={position.y}
                    draggable
                    onWheel={handleWheel}
                    onDragEnd={(e)=> {
                        setPosition({
                            x: e.target.x(),
                            y: e.target.y()
                        });
                    }}
                >
                    <Layer>
                        <Rect
                            x={0}
                            y={0}
                            width={baseplateSize.width}
                            height={baseplateSize.height}
                            fill="#ddd"
                            stroke="black"
                            strokeWidth={2}
                        />
                        <Rect
                            x={50}
                            y={50}
                            width={100}
                            height={100}
                            fill="lightblue"
                            draggable
                        />
                    </Layer>
                </Stage>
            )}
        </div>
    )
}