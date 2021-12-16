import React, { useCallback } from 'react';
import { Orientation } from '@visx/axis';
import { curveMonotoneX } from '@visx/curve';
import { AnimatedAxis, AnimatedGridColumns, AnimatedGridRows } from '@visx/react-spring';
import { AreaClosed, Bar, Line } from '@visx/shape';
import { LinearGradient } from "@visx/gradient";
import { Group } from '@visx/group';
import { useTooltip, useTooltipInPortal, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { bisector } from 'd3-array';


// accessors
const getDate = (d) => new Date(d[0]);
const getPrice = (d) => d[1];

const bisectDate = bisector((d) => new Date(d[0])).left;
const tooltipStyles = {
    ...defaultStyles,
    border: '1px solid white',
    color: 'black',
  };


export default function AreaChart({
    chartData,
    xScale,
    yScale,
    width,
    yMax,
    margin,
    left,
    top,
    hideBottomAxis = false,
    hideLeftAxis = false,
    hideGrid = false,
    children,
    chartColor,
}) {

    console.log(chartColor);
    const {
        tooltipData,
        tooltipLeft,
        tooltipTop,
        tooltipOpen,
        showTooltip,
        hideTooltip,
    } = useTooltip();

    // const innerWidth = width - margin.left - margin.right;

    const { containerRef } = useTooltipInPortal({
        // use TooltipWithBounds
        detectBounds: true,
        // when tooltip containers are scrolled, this will correctly update the Tooltip position
        scroll: true,
    })

    const handleMouseOver = useCallback((event) => {
        const { x } = localPoint(event) || { x: 0 };
        const x0 = xScale.invert(x);
        const index = bisectDate(chartData, x0, 1);
        const d0 = chartData[index - 1];
        const d1 = chartData[index];
        let d = d0;
        if (d1 && getDate(d1)) {
            d = x0.valueOf() - getDate(d0).valueOf() > getDate(d1).valueOf() - x0.valueOf() ? d1 : d0;
        }
        showTooltip({
            tooltipData: d,
            tooltipLeft: x,
            tooltipTop: yScale(getPrice(d)),
        });
        },
        [showTooltip, xScale, yScale, chartData]
    );

    const gridColor = '#ccc';
    const axisColor = '#fff';
    const tickLabelColor = '#fff';

    const tickLabelProps = () => {
        return {
            fill: tickLabelColor,
            fontSize: 12,
            fontFamily: 'sans-serif',
            textAnchor: 'middle',
        }
    };

    const tickLabelPropsLeft = () => {
        return {
            fill: tickLabelColor,
            fontSize: 12,
            fontFamily: 'sans-serif',
            x: -5,
            textAnchor: 'end',
        }
    };

    return (
        <div width={width + margin.left + margin.right} height={yMax + margin.bottom + margin.top} ref={containerRef} style={{position: 'relative'}}>
            <svg
                width={width + margin.left + margin.right}
                height={yMax + margin.bottom + margin.top}
            >
                <Group 
                    left={left || margin.left}
                    // top={top || margin.top}
                >
                    <LinearGradient
                        id="area-gradient"
                        from={chartColor}
                        to={chartColor}
                        toOpacity={0.3}
                    />
                    {!hideGrid && (
                        <>
                            <AnimatedGridRows
                                scale={yScale}
                                width={width}
                                animationTrajectory='outside'
                                stroke={gridColor}
                            />
                            <AnimatedGridColumns
                                scale={xScale}
                                animationTrajectory='outside'
                                stroke={gridColor}
                            />
                        </>
                    )}
                    {!hideBottomAxis && (
                        <AnimatedAxis
                            orientation={Orientation.bottom}
                            top={yMax}
                            scale={xScale}
                            // tickFormat={tickFormat}
                            // tickValues={dateValues}
                            numTicks={7}
                            animationTrajectory='outside'
                            tickLabelProps={tickLabelProps}
                            stroke={axisColor}
                            tickStroke={axisColor}
                        />
                    )}
                    {!hideLeftAxis && (
                        <AnimatedAxis
                            orientation={Orientation.left}
                            scale={yScale}
                            numTicks={5}
                            stroke={axisColor}
                            tickStroke={axisColor}
                            animationTrajectory='outside'
                            tickLabelProps={tickLabelPropsLeft}    
                        />
                    )}
                    <AreaClosed
                        data={chartData}
                        x={(d) => xScale(getDate(d)) || 0}
                        y={(d) => yScale(getPrice(d)) || 0}
                        yScale={yScale}
                        strokeWidth={1}
                        stroke="url(#area-gradient)"
                        fill="url(#area-gradient)"
                        curve={curveMonotoneX}
                    />
                    <Bar
                        width={width - margin.left  - margin.right}
                        height={yMax}
                        fill="transparent"
                        rx={14}
                        onTouchStart={handleMouseOver}
                        onTouchMove={handleMouseOver}
                        onMouseMove={handleMouseOver}
                        onMouseLeave={() => hideTooltip()}
                    />
                    {children}
                              {tooltipData && (
            <g>
              <Line
                from={{ x: tooltipLeft, y: margin.top }}
                to={{ x: tooltipLeft, y: yMax + margin.top }}
                strokeWidth={2}
                pointerEvents="none"
                strokeDasharray="5,2"
                stroke="white"
              />
              <circle
                cx={tooltipLeft}
                cy={tooltipTop + 1}
                r={4}
                fill="black"
                fillOpacity={0.1}
                stroke="black"
                strokeOpacity={0.1}
                strokeWidth={2}
                pointerEvents="none"
              />
              <circle
                cx={tooltipLeft}
                cy={tooltipTop}
                r={4}
                stroke="white"
                strokeWidth={2}
                pointerEvents="none"
              />
            </g>
          )}
                </Group>
            </svg>
            {tooltipOpen && (
                <div>
                    <TooltipWithBounds
                    key={Math.random()}
                    top={tooltipTop - 30}
                    left={tooltipLeft + 60}
                    style={tooltipStyles}
                    >
                        <p>{`${tooltipData[0]}`}</p>
                        <p>{`£${tooltipData[1]}`}</p>
                    </TooltipWithBounds>
                </div>
            )}
        </div>
    )
}