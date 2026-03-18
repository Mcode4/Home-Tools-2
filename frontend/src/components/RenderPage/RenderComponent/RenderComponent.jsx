import { useState, useEffect, useRef } from "react";
import { Stage, Layer, Rect, Line } from "react-konva";
import "./RenderComponent.css";

export default function RenderComponent() {
    const containerRef = useRef(null);

    const [size, setSize] = useState({width: 0, height: 0});
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({x: 0, y: 0});
    const [baseplateSize, setBaseplateSize] = useState({width: 800, height: 600});

    const [gridActive, setGridActive] = useState(true);
    const [gridPixelSize, setGridPixelSize] = useState(81);
    const [gridStroke, setgridStroke] = useState(1);
    const [gridColor, setGridColor] = useState("#ccc")

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

    const Grid = ({ width, height, gridSize, scale }) => {
        const lines = [];
        const strokeWidth = 1 / scale;

        const centerX = width / 2;
        const centerY = height / 2;

        lines.push(
            <Line
                key={`grid-x${centerX}`}
                points={[centerX, 0, centerX, height]}
                stroke={gridColor}
                strokeWidth={strokeWidth*2}
            />
        )

        lines.push(
            <Line
                key={`grid-y${centerY}`}
                points={[ 0, centerY, width, centerY]}
                stroke={gridColor}
                strokeWidth={strokeWidth*2}
            />
        )

        for(let i=1; i<(width/gridSize)/2; i++) {
            const plusX = centerX + (gridSize * i);
            const minusX = centerX - (gridSize * i);
            lines.push(
                <Line
                    key={`grid-x${plusX}`}
                    points={[plusX, 0, plusX, height]}
                    stroke={gridColor}
                    strokeWidth={strokeWidth}
                />,
                <Line
                    key={`grid-x${minusX}`}
                    points={[minusX, 0, minusX, height]}
                    stroke={gridColor}
                    strokeWidth={strokeWidth}
                />
            );
        }
        for(let i=1; i<(height/gridSize)/2; i++) {
            const plusY = centerY + (gridSize*i);
            const minusY = centerY - (gridSize*i);
            lines.push(
                <Line
                    key={`grid-y${plusY}`}
                    points={[ 0, plusY, width, plusY]}
                    stroke={gridColor}
                    strokeWidth={strokeWidth}
                />,
                <Line
                    key={`grid-y${minusY}`}
                    points={[ 0, minusY, width, minusY]}
                    stroke={gridColor}
                    strokeWidth={strokeWidth}
                />
            )
        }
        return <>{lines}</>
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
                    onDragMove={(e) => positionRef.current = e.target.position()}
                    onDragEnd={(e)=> {
                        const stage = e.target
                        const newPos = clampPosition(stage.position(), stage.scaleX());
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
                            stroke={gridColor}
                            strokeWidth={2}
                        />
                        {gridActive && (
                        <Grid
                            width={baseplateSize.width}
                            height={baseplateSize.height}
                            gridSize={gridPixelSize}
                            scale={scaleRef.current}
                        />
                        )}
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