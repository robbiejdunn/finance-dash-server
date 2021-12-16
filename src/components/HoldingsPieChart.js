// Influenced by https://www.youtube.com/watch?v=bL3P9CqQkKw

import React, { useState } from 'react';
import { Group } from '@visx/group';
import { Pie } from '@visx/shape';
import { Text } from '@visx/text';


export default function HoldingsPieChart(props) {
    const [active, setActive] = useState(null);
    const width = 350;
    const half = width / 2;

    const holdingPct = (activeHolding) => {
        const holdingsTotal = props?.chartData.reduce((a, b) => a + b.marketValue, 0);
        const percent = (100 * activeHolding.marketValue / holdingsTotal).toFixed(2);
        return `${percent}%`;
    }

    return (
        <svg width={width} height={width}>
            <Group top={half} left={half}>
                <Pie 
                    data={props?.chartData}
                    pieValue={(data) => data.marketValue}
                    outerRadius={half}
                    innerRadius={({data}) => {
                        const size = active && active.symbol === data.symbol ? 40 : 35;
                        return half - size;
                    }}
                    padAngle={0.02}
                >
                    {(pie) => {
                        return pie.arcs.map((arc) => {
                            return (
                                <g 
                                    key={arc.data.symbol}
                                    onMouseEnter={() => setActive(arc.data)}
                                    onMouseLeave={() => setActive(null)}
                                    cursor='pointer'
                                >
                                    <path d={pie.path(arc)} fill={arc.data.color}></path>
                                </g>
                            )
                        })
                    }}
                </Pie>
                {active ? (
                    <>
                        <Text textAnchor="middle" fill="#fff" fontSize={30} dy={-40}>
                            {`${holdingPct(active)}`}
                        </Text>
                        <Text textAnchor="middle" fill={active.color} fontSize={25}>
                            {active.symbol}
                        </Text>
                        <Text textAnchor="middle" fill="#bbb" fontSize={20} dy={30}>
                            {`${active.units} units`}
                        </Text>
                        <Text textAnchor="middle" fill="#bbb" fontSize={20} dy={60}>
                            {`£${active.marketValue.toFixed(2)}`}
                        </Text>
                    </>
                ) : (
                    <Text textAnchor="middle" fill="#fff" fontSize={30}>
                        {`${props?.chartData.length} holdings`}
                    </Text>
                )}
                
            </Group>
        </svg>
    )
}
