export const category20Colors = [
    "#1f77b4",
    "#aec7e8",
    "#ff7f0e",
    "#ffbb78",
    "#2ca02c",
    "#98df8a",
    "#d62728",
    "#ff9896",
    "#9467bd",
    "#c5b0d5",
    "#8c564b",
    "#c49c94",
    "#e377c2",
    "#f7b6d2",
    "#7f7f7f",
    "#c7c7c7",
    "#bcbd22",
    "#dbdb8d",
    "#17becf",
    "#9edae5",
]


export function toCurrencyString(v) {
    const parsed = parseFloat(v);
    const asStr = Math.abs(parsed).toLocaleString(
        'EN-US',
        {
            minimumFractionDigits: 2
        }
    );
    return `£${asStr}`;
    if (parsed < 0) {
        return `-£${asStr}`;
    } else {
        return `+£${asStr}`;
    }
}

export function toGainString(v) {
    const parsed = parseFloat(v);
    const currencyStr = toCurrencyString(v);
    if (parsed < 0) {
        return `-${currencyStr}`;
    } else {
        return `+${currencyStr}`;
    }
}
