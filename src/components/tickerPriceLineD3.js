import {
  AnimatedAxis, // any of these can be non-animated equivalents
  AnimatedGrid,
  AnimatedLineSeries,
  XYChart,
  Tooltip,
  buildChartTheme,
} from '@visx/xychart';
import { curveCardinal } from '@visx/curve';
import makeStyles from '@mui/styles/makeStyles';

const useStyles = makeStyles((theme) => ({
  axis: {
    color: 'yellow',
  }
}));

export default function XYGraph(props) {
    const classes = useStyles();
    const data = props['graphData'].map(d => {
        return {
            x: d['datetime']['S'],
            y: d['price']['N'],
        }
    });
    
    const accessors = {
        xAccessor: d => d.x,
        yAccessor: d => d.y,
    };

    const customTheme = buildChartTheme({
      colors: 'lightgreen',
      gridColor: 'white',
      gridColorDark: 'black',
      yTickLineStyles: {
        'style': {
          'color': 'yellow',
        }
      }
      // gridColor: 'white',
    });

    const minDomain = () => {
        return Math.min.apply(null, data.map(function(p) {
            return p['y'];
        }));
    }

    const maxDomain = () => {
        return Math.max.apply(null, data.map(function(p) {
            return p['y'];
        }));
    }

    return (
        <XYChart theme={customTheme} height={300} xScale={{ type: 'band' }} yScale={{ type: 'linear', domain: [minDomain(), maxDomain()], zero: false }}>
        <AnimatedAxis orientation="bottom" />
        <AnimatedAxis orientation="left" />
        <AnimatedGrid numTicks={10} />
        <AnimatedLineSeries dataKey="Price" curve={curveCardinal} data={data} {...accessors} />
        <Tooltip
          snapTooltipToDatumX
          snapTooltipToDatumY
          showVerticalCrosshair
          showSeriesGlyphs
          renderTooltip={({ tooltipData, colorScale }) => (
            <div>
              <div style={{ color: colorScale(tooltipData.nearestDatum.key) }}>
                {tooltipData.nearestDatum.key}
              </div>
              {accessors.xAccessor(tooltipData.nearestDatum.datum)}
              {', '}
              {accessors.yAccessor(tooltipData.nearestDatum.datum)}
            </div>
          )}
        />
      </XYChart>
    );
}
