//https://codesandbox.io/s/github/airbnb/visx/tree/master/packages/visx-demo/src/sandboxes/visx-brush?file=/Example.tsx:965-1080
import React, { useMemo, useState, useRef } from 'react';
import AreaChart from "./AreaChart";
import { extent, max } from 'd3-array';
import { Brush } from '@visx/brush';
import { PatternLines } from '@visx/pattern';
import { scaleLinear, scaleTime } from '@visx/scale';

const PATTERN_ID = 'brush_pattern';
const selectedBrushStyle = {
    fill: `url(#${PATTERN_ID})`,
    stroke: 'white',
};

// accessors
const getDate = (d) => new Date(d[0]);
const getPrice = (d) => parseFloat(d[1]);

export default function HoldingPriceChart({
    data,
    circlesData,
    width = 1450,
    height = 600,
    margin = {
        top: 20,
        left: 50,
        bottom: 20,
        right: 20,
    },
    brushMargin = {
        top: 10,
        bottom: 15,
        left: 50,
        right: 20,
    },
    chartSeperation = 30,
    accentColor = '#f6acc8',
    chartColor = '#75daad',
}) {
    const brushRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filteredData, setFilteredData] = useState(data);

    const onBrushChange = (domain) => {
        if (!domain) return;
        const { x0, x1, y0, y1 } = domain;
        const dataCopy = data.filter((d) => {
            const x = getDate(d).getTime();
            const y = getPrice(d);
            return x > x0 && x < x1 && y > y0 && y < y1;
        });
        setFilteredData(dataCopy);
    }

    const innerHeight = height - margin.top - margin.bottom;
    const topChartBottomMargin = chartSeperation + 10;
    const topChartHeight = 0.8 * innerHeight - topChartBottomMargin;
    const bottomChartHeight = innerHeight - topChartHeight - chartSeperation;

    // bounds
    const xMax = Math.max(width - margin.left - margin.right, 0);
    const yMax = Math.max(topChartHeight, 0);
    const xBrushMax = Math.max(width - brushMargin.left - brushMargin.right, 0);
    const yBrushMax = Math.max(bottomChartHeight - brushMargin.top - brushMargin.bottom, 0);

    // scales
    const dateScale = useMemo(
        () => 
            scaleTime({
                range: [0, xMax],
                domain: extent(filteredData, getDate),
            }),
        [xMax, filteredData],
    );
    const priceScale = useMemo(
        () => 
            scaleLinear({
                range: [yMax, 0],
                domain: [0, max(filteredData, getPrice) || 0],
                nice: true,
            }),
        [yMax, filteredData],
    );
    const brushDateScale = useMemo(
        () =>
            scaleTime({
                range: [0, xBrushMax],
                domain: extent(data, getDate),
            }),
        [xBrushMax, data],
    );
    const brushPriceScale = useMemo(
        () =>
            scaleLinear({
                range: [yBrushMax, 0],
                domain: [0, max(data, getPrice) || 0],
                nice: true,
            }),
        [yBrushMax, data],
    );
    const initialBrushPosition = useMemo(
        () => {
            if(data.length > 0) {
                setIsLoading(false);
                if(data.length > 365) {
                    setFilteredData(data.slice(data.length - 365, data.length - 1))
                    return {
                        start: { x: brushDateScale(getDate(data[data.length - 365])) },
                        end: { x: brushDateScale(getDate(data[data.length - 1])) }
                    }
                } else {
                    setFilteredData(data)
                    return {
                        start: { x: brushDateScale(getDate(data[0])) },
                        end: { x: brushDateScale(getDate(data[data.length - 1])) },
                    }
                }
            }
        },
        [brushDateScale, data],
    );

    return (
        <div>
            {isLoading ? (
                <>loading</>
                // <p>Loading</p>
            ) : (
                <div>
                    <AreaChart 
                        chartData={filteredData}
                        circlesData={circlesData}
                        width={width}
                        margin={{ ...margin, bottom: topChartBottomMargin }}
                        yMax={yMax}
                        xScale={dateScale}
                        yScale={priceScale}
                        hideGrid
                        chartColor={chartColor}  
                    />
                    <AreaChart
                        hideLeftAxis
                        chartData={data}
                        width={width}
                        yMax={yBrushMax}
                        xScale={brushDateScale}
                        yScale={brushPriceScale}
                        margin={brushMargin}
                        top={topChartHeight + topChartBottomMargin + margin.top}
                        hideGrid
                        chartColor={chartColor}  
                    >
                        <PatternLines
                            id={PATTERN_ID}
                            height={8}
                            width={8}
                            stroke={accentColor}
                            strokeWidth={1}
                            orientation={['diagonal']}
                        />
                        <Brush
                            xScale={brushDateScale}
                            yScale={brushPriceScale}
                            width={xBrushMax}
                            height={yBrushMax}
                            margin={brushMargin}
                            handleSize={8}
                            innerRef={brushRef}
                            resizeTriggerAreas={['left', 'right']}
                            brushDirection="horizontal"
                            initialBrushPosition={initialBrushPosition}
                            onChange={onBrushChange}
                            onClick={() => setFilteredData(data)}
                            selectedBoxStyle={selectedBrushStyle}
                            useWindowMoveEvents
                        />
                    </AreaChart>
                </div>
            )}
        </div>
    )
}
