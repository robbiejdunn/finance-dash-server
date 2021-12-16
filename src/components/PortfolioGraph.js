import {
    AreaSeries,
    AnimatedAxis, // any of these can be non-animated equivalents
    AnimatedGrid,
    darkTheme,
    AnimatedAreaStack,
    XYChart,
} from '@visx/xychart';

import React, { useEffect, useState } from 'react';


export default function PortfolioGraph(props) {
    const [data, setData] = useState([]);

    useEffect(() => {
        if(props.holdingsJoined) {
            console.log(props.holdingsJoined)
            let portData = []
            Object.entries(props.holdingsJoined).map(([holdingId, holding]) => {
                let holdingPrices = [];
                let sortedTxDateValues = null;
                if(holding.transactions) {
                    sortedTxDateValues = [...holding.transactions].sort((a, b) => {
                        if(a.datetime > b.datetime) {
                            return 1;
                        } else if (b.datetime > a.datetime) {
                            return -1;
                        } else {
                            return 0;
                        }
                    });
                }
                holding?.t_prices?.map((tickerPrice) => {
                    holdingPrices.push({
                        x: tickerPrice.datetime,
                        // x: new Date(tickerPrice.datetime.S),
                        // x: tickerPrice.datetime.S.slice(0, 16).replace("T", " "),
                        y: tickerPrice.price,
                        color: holding?.color,
                    });
                    return null;
                });
                holdingPrices.sort((a,b) => (a.x > b.x) ? 1 : ((b.x > a.x) ? -1 : 0))

                let currentTx = 0;
                let currentUnits = 0;
                if(sortedTxDateValues) {
                    holdingPrices.map((price) => {
                        if(currentTx !== sortedTxDateValues.length) {
                            while(price.x >= sortedTxDateValues[currentTx].datetime) {
                                currentUnits += parseFloat(sortedTxDateValues[currentTx].units);
                                currentTx += 1;
                                if(currentTx === sortedTxDateValues.length) {
                                    break
                                }
                            }
                        }
                        price.y = price.y * currentUnits;
                        return null;
                    })
                    portData.push([holding.ticker_name, holdingPrices]);
                }
                return null;
            });
            setData(portData);
        }
    }, [props.holdingsJoined]);
  
    const accessors = {
        xAccessor: d => new 
        Date(d.x),
        yAccessor: d => d.y,
    };

    return (
        <XYChart 
            height={400}
            xScale={{ 
                type: 'time',
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
                    console.log(holdingName, holding)
                    return (
                        <AreaSeries 
                            key={holdingName}
                            dataKey={holdingName}
                            fillOpacity={0.4}
                            data={holding}
                            lineProps={{fill: holding.color}}
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
