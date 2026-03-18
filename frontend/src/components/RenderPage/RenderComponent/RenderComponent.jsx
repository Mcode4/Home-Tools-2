import { useState, useEffect, useRef } from "react";
import { Stage, Layer, Rect } from "react-konva";
import "./RenderComponent.css";

export default function RenderComponent() {
    const containerRef = useRef(null);

    const [size, setSize] = useState({width: 0, height: 0});
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({x: 0, y: 0});
    const [baseplateSize, setBaseplateSize] = useState({width: 800, height: 600});

    const scaleRef = useRef(1);
    const positionRef = useRef({x: 0, y: 0});

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

    const getWorldPos = (e) => {
        const pointer = e.target.getStage().getPointerPosition();
        const scale = scaleRef.current;
        const pos = positionRef.current;

        return {
            x: (pointer.x - pos.x) / scale,
            y: (pointer.y - pos.y) / scale 
        }
    }

    const handleWheel = (e) => {
        e.evt.preventDefault();

        const scaleBy = 1.05;
        const oldScale = scaleRef.current;
        const oldPos = positionRef.current;

        const stage = e.target.getStage();
        stage.stopDrag();

        // CONVERT TO WOLRD COORD
        const pointer = stage.getPointerPosition();
        const mousePointTo = {
            x: (pointer.x - oldPos.x) / oldScale,
            y: (pointer.y - oldPos.y) / oldScale 
        }

        // ZOOM IN / ZOOM OUT
        let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
        newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

        // NEW BASEPLATE POSTION
        let newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale
        }
        // newPos = clampPosition(newPos, newScale);

        // UPDATES
        scaleRef.current = newScale;
        positionRef.current = newPos;
        setScale(newScale);
        setPosition(newPos);
    }

    const clampPosition = (pos, scaleVal = scale) => {
        const contentWidth = baseplateSize.width * scaleVal;
        const contentHeight = baseplateSize.height * scaleVal;

        return { 
            x: Math.min(0, Math.max(size.width - contentWidth, pos.x)),
            y: Math.min(0, Math.max(size.height - contentHeight, pos.y))
        }
    }

    return (
        <div id="render-component" ref={containerRef}>
            {size.width > 0 && (
                <Stage 
                    width={size.width} 
                    height={size.height}
                    scaleX={scale}
                    scaleY={scale}
                    draggable
                    onWheel={handleWheel}
                    onDragMove={(e) => {
                        positionRef.current = {
                            x: e.target.x(),
                            y: e.target.y()
                        }
                    }}
                    onDragEnd={(e)=> {
                        const newPos = clampPosition(
                            { x: e.target.x(), y: e.target.y() },
                            scaleRef.current
                        );
                        positionRef.current = newPos;
                        setPosition(newPos);
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
                            // onDragStart={(e)=> e.cancelBubble = true}
                        />
                    </Layer>
                </Stage>
            )}
        </div>
    )
}