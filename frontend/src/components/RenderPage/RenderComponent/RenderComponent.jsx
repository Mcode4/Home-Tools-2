import { useState, useEffect, useRef } from "react";
import { Stage, Layer, Rect, Line, Circle, Text } from "react-konva";
import "./RenderComponent.css";
import { useActionData } from "react-router-dom";

export default function RenderComponent({ activeTool }) {
    const containerRef = useRef(null);

    const [size, setSize] = useState({width: 0, height: 0});
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({x: 0, y: 0});
    const [baseplateSize, setBaseplateSize] = useState({width: 800, height: 600});

    const [gridActive, setGridActive] = useState(true);
    const [gridPixelSize, setGridPixelSize] = useState(50);
    const [gridStroke, setgridStroke] = useState(1);
    const [gridColor, setGridColor] = useState("#ccc")

    const [lines, setLines] = useState([]);
    const [handleEnds, setHandleEnds] = useState([]);
    const [cursor, setCursor] = useState({x: null, y: null, type: "crosshair"});
    const [texts, setTexts] = useState([]);
    const [editingText, setEditingText] = useState({});

    const scaleRef = useRef(1);
    const positionRef = useRef({x: 0, y: 0});
    const drawingRef = useRef(false);

    const MIN_SCALE = 0.5;
    const MAX_SCALE = 3;

    useEffect(()=> {
        console.log("TOOL CHANGED", activeTool);
        if(activeTool?.type === "handle") {
            const newHandles = lines?.map(line => ({
                start: [line.points[0], line.points[1]],
                end: [line.points[2], line.points[3]],
                lineColor: line.color
            }))
            setHandleEnds(newHandles);
            setCursor(c => ({...c, type: "grab"}));
        } else {
            if(handleEnds.length > 0)setHandleEnds([]);
            if(["grab", "grabbing"].includes(cursor.type))setCursor(c => ({...c, type: "crosshair"}));
        }

        if(activeTool?.type === "clear") {
            setLines([]);
        }
        
    }, [activeTool?.type, lines]);

    useEffect(()=> {
        console.log("LINES CHANGED", lines);
    }, [lines]);

    useEffect(()=> {
        console.log("TEXTS CHANGED", texts);
    }, [texts]);

    useEffect(()=> {
        console.log("HANDLE ENDS CHANGED", handleEnds);
    }, [handleEnds]);

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

    const snap = (value, gridSize) => {
        return Math.round(value/gridSize) * gridSize;
    }

    const handleMouseDown = (e) => {
        if(activeTool?.type === "eraser") {
            const stage = e.target.getStage();
            const point = stage.getRelativePointerPosition();

            setLines(prev =>
                prev.filter(line =>
                    !isPointNearLine(point.x, point.y, line, activeTool.radius)
                )
            );
            setTexts(prev =>
                prev.filter(t =>
                    Math.hypot(point.x - t.x, point.y - t.y) > activeTool.radius
                )
            );
            drawingRef.current = true;
        } else if(activeTool?.type === "text") {
            const stage = e.target.getStage();
            const point = stage.getRelativePointerPosition();

            setTexts(prev => [
                ...prev,
                {
                    id: Date.now().toString(),
                    x: point.x,
                    y: point.y,
                    text: "Double click to edit",
                    fontSize: activeTool?.width ?? 16,
                    color: activeTool?.color ?? "#000"
                }
            ])
        }
        if(!activeTool || activeTool?.type !== "line") return;

        const stage = e.target.getStage();
        stage.stopDrag();

        // const pointer = stage.getPointerPosition();
        // const worldX = (pointer.x - positionRef.current.x) / scaleRef.current;
        // const worldY = (pointer.y - positionRef.current.y) / scaleRef.current;
        
        const point = stage.getRelativePointerPosition();
        const worldX = activeTool?.snap ? snap(point.x, gridPixelSize) : point.x; 
        const worldY = activeTool?.snap ? snap(point.y, gridPixelSize) : point.y;

        drawingRef.current = true;
        setLines(prev => [
            ...prev,
            {
                id: Date.now().toString(),
                points: [worldX, worldY, worldX, worldY],
                color: activeTool.color ?? "#000",
                width: activeTool.width ?? 2,
                draggable: activeTool.draggable ?? false
            }
        ]);
    }

    const handleMouseMove = (e) => {
        const stage = e.target.getStage();
        const point = stage.getRelativePointerPosition();
        setCursor(c => ({...c, x: point.x, y: point.y}));

        if(!drawingRef.current) return;

        
        stage.stopDrag();

        if(activeTool?.type === "eraser") {
            const stage = e.target.getStage();
            stage.stopDrag();
            const point = stage.getRelativePointerPosition();

            setLines(prev => 
                prev.filter(line =>
                    !isPointNearLine(point.x, point.y, line, activeTool.radius / scaleRef.current)
                )
            );
            setTexts(prev =>
                prev.filter(t =>
                    Math.hypot(point.x - t.x, point.y - t.y) > activeTool.radius
                )
            );
            return;
        }

        const worldX = point.x; 
        const worldY = point.y;

        setLines(prev => {
            const lastLine = prev[prev.length-1];
            const updatedLine = {
                ...lastLine,
                points: [
                    lastLine.points[0],
                    lastLine.points[1],
                    worldX,
                    worldY
                ]
            }
            return [...prev.slice(0, prev.length-1), updatedLine];
        });
    }

    const handleMouseUp = (e) => {
        if(!drawingRef.current) return;
        drawingRef.current = false;
        if(activeTool?.type === "line" && activeTool?.snap) {
            setLines(prev => {
                const lastLine = prev[prev.length-1];
                const updatedLine = {
                    ...lastLine,
                    points: [
                        lastLine.points[0],
                        lastLine.points[1],
                        snap(lastLine.points[2], gridPixelSize),
                        snap(lastLine.points[3], gridPixelSize)
                    ]
                }
                return [...prev.slice(0, prev.length-1), updatedLine];
            });
        }
    }

    const handleAnchorDrag = (e, id, index) => {
        const stage = e.target.getStage();
        const point = stage.getRelativePointerPosition();

        const worldX = activeTool?.snap ? snap(point.x, gridPixelSize) : point.x;
        const worldY = activeTool?.snap ? snap(point.y, gridPixelSize) : point.y;

        setLines(prev => 
            prev.map(line => {
                if(line.id !== id) return line;

                const newPoints = [...line.points]
                if(index === 0) {
                    newPoints[0] = worldX;
                    newPoints[1] = worldY;
                } else {
                    newPoints[2] = worldX;
                    newPoints[3] = worldY;
                }

                return {...line, points: newPoints}
            })
        );
    }

    const isPointNearLine = (px, py, obj, threshold = 10) => {
        if(obj.points) {
            const [x1, y1, x2, y2] = obj.points;
            const A = px - x1;
            const B = py - y1;
            const C = x2 - x1;
            const D = y2 - y1;

            const dot = A * C + B * D;
            const lenSq = C * C + D * D;

            let param = lenSq !== 0 ? dot / lenSq : -1;
            let xx, yy;

            if(param < 0) {
                xx = x1;
                yy = y1;
            } else if(param > 1) {
                xx = x2;
                yy = y2;
            } else {
                xx = x1 + param * C;
                yy = y1 + param * D;
            }

            const dx = px - xx;
            const dy = py - yy;

            return Math.sqrt(dx * dx + dy * dy) < threshold;
        }
    }

    return (
        <div id="render-component" ref={containerRef}>
            {size.width > 0 && (
            <>
                <Stage 
                    width={size.width} 
                    height={size.height}
                    style={{cursor: cursor.type}}
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
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
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
                        {lines.length > 0 && lines.map(line => (
                            <>
                            <Line
                                key={`line-${line.id}`}
                                points={line.points}
                                stroke={line.color}
                                strokeWidth={line.width}
                                draggable={line.draggable}
                                onDragEnd={(e)=> {
                                    const dx = e.target.x() / scaleRef.current;
                                    const dy = e.target.y() / scaleRef.current;
                                    setLines(prev => 
                                        prev.map(l =>
                                            l.id === line.id
                                            ? {...l, points: l.points.map((p, i) => i%2 === 0 ? p+dx : p+dy)}
                                            : l
                                        )
                                    )
                                    e.target.position({x: 0, y: 0})
                                }}
                            />
                            {handleEnds?.length > 0 && handleEnds?.map(({start, end, lineColor}, i) => (
                                <>
                                <Circle
                                    key={`hstart-${i}`}
                                    x={start[0]}
                                    y={start[1]}
                                    radius={8/scaleRef.current}
                                    fill={activeTool?.color}
                                    stroke={lineColor}
                                    strokeWidth={activeTool?.width}
                                    draggable
                                    onDragMove={(e)=> handleAnchorDrag(e, line.id, 0)}
                                />

                                <Circle
                                    key={`hend-${i}`}
                                    x={end[0]}
                                    y={end[1]}
                                    radius={8/scaleRef.current}
                                    fill={activeTool?.color}
                                    stroke={lineColor}
                                    strokeWidth={activeTool?.width}
                                    draggable
                                    onDragMove={(e)=> handleAnchorDrag(e, line.id, 1)}
                                />
                                </>
                            ))}
                            </>
                            
                        ))}
                        <Rect
                            x={50}
                            y={50}
                            width={100}
                            height={100}
                            fill="lightblue"
                            draggable
                        />
                        {texts.length > 0 && texts.map(t => (
                            <Text
                                key={`text-${t.id}`}
                                x={t.x}
                                y={t.y}
                                text={t.text}
                                fontSize={t.fontSize}
                                fill={t.color}
                                draggable
                                onDblClick={(e) => {
                                    const textNode = e.target;
                                    const stage = textNode.getStage();
                                    const absPos = textNode.getAbsolutePosition();

                                    setEditingText({
                                        id: t.id,
                                        x: absPos.x,
                                        y: absPos.y,
                                        value: t.text
                                    });
                                }}
                            />
                        ))}
                        {activeTool?.type === "eraser" && cursor?.x && (
                            <Circle
                                x={cursor.x}
                                y={cursor.y}
                                radius={activeTool.radius}
                                stroke="rgba(255, 0, 0, 0.2)"
                            />
                        )}
                    </Layer>
                </Stage>

                {Object.keys(editingText ?? {}).length > 0 && (
                <input 
                    style={{
                        position: "absolute",
                        top: editingText?.y,
                        left: editingText?.x,
                        fontSize: "16px",
                        border: "1px solid black",
                        padding: "2px"
                    }}
                    value={editingText?.value}
                    onChange={(e) =>
                        setEditingText(prev => ({...prev, value: e.target.value}))
                    }
                    onBlur={()=> {
                        setTexts(prev =>
                            prev.map(t =>
                                t.id === editingText.id
                                    ? {...t, text: editingText?.value}
                                    : t
                            )
                        )
                        setEditingText(null)
                    }}
                />
                )}
            </>
            )}
        </div>
    )
}