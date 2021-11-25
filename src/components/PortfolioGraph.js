import { scaleTime, scaleUtc } from '@visx/scale';
import {
    AreaSeries,
    AnimatedAxis, // any of these can be non-animated equivalents
    AnimatedGrid,
    darkTheme,
    AnimatedAreaStack,
    XYChart,
    Tooltip,
} from '@visx/xychart';

import React, { useEffect, useState } from 'react';


export default function PortfolioGraph(props) {
    const [data, setData] = useState([]);

    useEffect(() => {
        if(props.holdingsJoined) {
            let portData = []
            Object.entries(props.holdingsJoined).map(([holdingId, holding]) => {
                let holdingPrices = [];
                let sortedTxDateValues = null;
                if(holding.transactions) {
                    sortedTxDateValues = [...holding.transactions].sort((a, b) => {
                        if(a.datetime.S > b.datetime.S) {
                            return 1;
                        } else if (b.datetime.S > a.datetime.S) {
                            return -1;
                        } else {
                            return 0;
                        }
                    });
                }
                holding?.ticker?.prices?.map((tickerPrice) => {
                    holdingPrices.push({
                        x: tickerPrice.datetime.S,
                        // x: new Date(tickerPrice.datetime.S),
                        // x: tickerPrice.datetime.S.slice(0, 16).replace("T", " "),
                        y: tickerPrice.price.N,
                        color: holding?.color,
                    });
                });
                holdingPrices.sort((a,b) => (a.x > b.x) ? 1 : ((b.x > a.x) ? -1 : 0))

                let currentTx = 0;
                let currentUnits = 0;
                if(sortedTxDateValues) {
                    holdingPrices.map((price) => {
                        if(currentTx != sortedTxDateValues.length) {
                            while(price.x >= sortedTxDateValues[currentTx].datetime.S) {
                                currentUnits += parseFloat(sortedTxDateValues[currentTx].units.N);
                                currentTx += 1;
                                if(currentTx === sortedTxDateValues.length) {
                                    break
                                }
                            }
                        }
                        price.y = price.y * currentUnits;
                    })
                    portData.push([holding.name.S, holdingPrices]);
                }

                
            });
            setData(portData);
        }
    }, [props.holdingsJoined]);
  
    const data2 = [
        { x: '2020-01-01', y: 30 },
        { x: '2020-01-02', y: 40 },
        { x: '2020-01-03', y: 80 },
        { x: '2021-01-01', y: 50 },
        { x: '2021-01-02', y: 10 },
        { x: '2021-01-03', y: 20 },
    ];
  
    const accessors = {
        xAccessor: d => new 
        Date(d.x),
        yAccessor: d => d.y,
    };

    function tickFormat(v) {
        return v.toLocaleString()
    }

    return (
        <XYChart 
            height={400}
            xScale={{ 
                type: 'time',
                // domain: [new Date("2021-11-01T12:29:15.303Z"), new Date("2021-11-01T14:09:11.625Z")]
                // nice: true,
                padding: 10
            }} 
            yScale={{ type: 'linear', nice: true }} 
            theme={darkTheme}
        >
            <AnimatedAxis 
                orientation="bottom"
                label="Date"
                // tickFormat={tickFormat}
            />
            <AnimatedAxis orientation="left" label="Market Value (£)" />
            <AnimatedGrid columns={false} numTicks={4} />
            <AnimatedAreaStack stackOffset={0}>
                {data.map(([holdingName, holding]) => {
                    return (
                        <AreaSeries 
                            key={holdingName}
                            dataKey={holdingName}
                            fillOpacity={0.4}
                            data={holding}
                            lineProps={{fill: holding[0].color}}
                            {...accessors}
                        />
                    )
                })}
            </AnimatedAreaStack>
            {/* <Tooltip
                snapTooltipToDatumX
                snapTooltipToDatumY
                showVerticalCrosshair
                showSeriesGlyphs
                renderTooltip={({ tooltipData, colorScale }) => (
                    <div>
                        <div style={{ color: colorScale(tooltipData.nearestDatum.key) }}>
                        {tooltipData.nearestDatum.key}
                        </div>
                        {accessors.date(tooltipData.nearestDatum.datum)}
                        {', '}
                        {accessors.yAccessor(tooltipData.nearestDatum.datum)}
                    </div>
                )}
            /> */}
        </XYChart>
    )
}