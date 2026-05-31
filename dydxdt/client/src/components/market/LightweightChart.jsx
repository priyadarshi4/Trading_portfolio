import { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, LineSeries, HistogramSeries, AreaSeries } from 'lightweight-charts';

const COLORS = {
  bg:        '#030303',
  surface:   '#0a0a0a',
  border:    'rgba(255,255,255,0.05)',
  text:      'rgba(255,255,255,0.4)',
  acid:      '#e8ff00',
  neon:      '#00ffb3',
  violet:    '#a78bfa',
  danger:    '#ff3366',
  upCandle:  '#00ffb3',
  downCandle:'#ff3366',
  upWick:    '#00ffb3',
  downWick:  '#ff3366',
};

const chartOptions = {
  layout: {
    background:  { color: '#030303' },
    textColor:   COLORS.text,
    fontFamily:  "'Space Mono', monospace",
    fontSize:    10,
  },
  grid: {
    vertLines:   { color: 'rgba(255,255,255,0.03)' },
    horzLines:   { color: 'rgba(255,255,255,0.03)' },
  },
  crosshair: {
    vertLine: { color: 'rgba(232,255,0,0.3)', width: 1, style: 3, labelBackgroundColor: '#0a0a0a' },
    horzLine: { color: 'rgba(232,255,0,0.3)', width: 1, style: 3, labelBackgroundColor: '#0a0a0a' },
    mode: 1,
  },
  rightPriceScale: {
    borderColor: COLORS.border,
    textColor:   COLORS.text,
  },
  timeScale: {
    borderColor:     COLORS.border,
    textColor:       COLORS.text,
    timeVisible:     true,
    secondsVisible:  false,
    fixLeftEdge:     true,
    fixRightEdge:    true,
  },
  watermark: {
    visible: true,
    fontSize: 28,
    horzAlign: 'center',
    vertAlign: 'center',
    color: 'rgba(232,255,0,0.03)',
    text: 'Dy/Dx/Dt',
  },
};

// Simple indicator math (client-side for overlay drawing)
const calcEMA = (data, period) => {
  const k = 2 / (period + 1);
  const result = [];
  let prev = null;
  data.forEach((d, i) => {
    if (i < period - 1) { result.push(null); return; }
    if (i === period - 1) {
      prev = data.slice(0, period).reduce((s, v) => s + v.close, 0) / period;
      result.push({ time: d.time, value: prev }); return;
    }
    prev = d.close * k + prev * (1 - k);
    result.push({ time: d.time, value: parseFloat(prev.toFixed(5)) });
  });
  return result.filter(Boolean);
};

const calcSMA = (data, period) => {
  return data.slice(period - 1).map((d, i) => ({
    time:  d.time,
    value: parseFloat((data.slice(i, i + period).reduce((s, v) => s + v.close, 0) / period).toFixed(5)),
  }));
};

const calcBollingerBands = (data, period = 20, mult = 2) => {
  const sma = data.slice(period - 1).map((d, i) => {
    const slice = data.slice(i, i + period);
    const mean  = slice.reduce((s, v) => s + v.close, 0) / period;
    const std   = Math.sqrt(slice.reduce((s, v) => s + Math.pow(v.close - mean, 2), 0) / period);
    return { time: d.time, upper: mean + mult * std, middle: mean, lower: mean - mult * std };
  });
  return sma;
};

export default function LightweightChart({ candles = [], symbol = '', indicators = [], chartType = 'candlestick', height = 420 }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const seriesRefs   = useRef({});

  useEffect(() => {
    if (!containerRef.current || !candles.length) return;

    // Cleanup previous
    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }

    const chart = createChart(containerRef.current, {
      ...chartOptions,
      width:  containerRef.current.clientWidth,
      height,
    });
    chartRef.current = chart;

    // Format candles for lightweight-charts
    const formatted = candles.map(c => ({
      time:  typeof c.time === 'number' ? c.time : Math.floor(new Date(c.time).getTime() / 1000),
      open:  c.open,
      high:  c.high,
      low:   c.low,
      close: c.close,
    })).sort((a, b) => a.time - b.time);

    // Main series
    let mainSeries;
    if (chartType === 'candlestick' || chartType === 'heikinashi') {
      let data = formatted;
      if (chartType === 'heikinashi') {
        data = formatted.map((c, i) => {
          const prev = i > 0 ? data[i - 1] : c;
          const haClose = (c.open + c.high + c.low + c.close) / 4;
          const haOpen  = (prev.open + prev.close) / 2;
          const haHigh  = Math.max(c.high, haOpen, haClose);
          const haLow   = Math.min(c.low,  haOpen, haClose);
          return { time: c.time, open: haOpen, high: haHigh, low: haLow, close: haClose };
        });
      }
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor:        COLORS.upCandle,
        downColor:      COLORS.downCandle,
        borderUpColor:  COLORS.upWick,
        borderDownColor:COLORS.downWick,
        wickUpColor:    COLORS.upWick,
        wickDownColor:  COLORS.downWick,
      });
      mainSeries.setData(data);
    } else if (chartType === 'line') {
      mainSeries = chart.addSeries(LineSeries, { color: COLORS.acid, lineWidth: 2, priceLineVisible: false });
      mainSeries.setData(formatted.map(c => ({ time: c.time, value: c.close })));
    } else if (chartType === 'area') {
      mainSeries = chart.addSeries(AreaSeries, {
        lineColor: COLORS.acid, topColor: 'rgba(232,255,0,0.15)',
        bottomColor: 'rgba(232,255,0,0)', lineWidth: 2,
      });
      mainSeries.setData(formatted.map(c => ({ time: c.time, value: c.close })));
    }

    // Overlays
    if (indicators.includes('EMA20')) {
      const s = chart.addSeries(LineSeries, { color: '#e8ff00', lineWidth: 1, priceLineVisible: false, title: 'EMA20' });
      s.setData(calcEMA(formatted, 20));
    }
    if (indicators.includes('EMA50')) {
      const s = chart.addSeries(LineSeries, { color: '#a78bfa', lineWidth: 1, priceLineVisible: false, title: 'EMA50' });
      s.setData(calcEMA(formatted, 50));
    }
    if (indicators.includes('EMA200')) {
      const s = chart.addSeries(LineSeries, { color: '#ff3366', lineWidth: 1, priceLineVisible: false, title: 'EMA200' });
      s.setData(calcEMA(formatted, 200));
    }
    if (indicators.includes('SMA20')) {
      const s = chart.addSeries(LineSeries, { color: 'rgba(255,165,0,0.7)', lineWidth: 1, priceLineVisible: false, title: 'SMA20' });
      s.setData(calcSMA(formatted, 20));
    }
    if (indicators.includes('VWAP')) {
      let cumTPV = 0, cumVol = 0;
      const vwapData = candles.map(c => {
        cumTPV += (c.high + c.low + c.close) / 3 * (c.volume || 1);
        cumVol += c.volume || 1;
        return { time: typeof c.time === 'number' ? c.time : Math.floor(new Date(c.time).getTime() / 1000), value: cumTPV / cumVol };
      });
      const s = chart.addSeries(LineSeries, { color: '#38bdf8', lineWidth: 1, lineStyle: 2, priceLineVisible: false, title: 'VWAP' });
      s.setData(vwapData);
    }
    if (indicators.includes('BB')) {
      const bb = calcBollingerBands(formatted);
      const upper = chart.addSeries(LineSeries, { color: 'rgba(167,139,250,0.4)', lineWidth: 1, lineStyle: 2, priceLineVisible: false });
      const mid   = chart.addSeries(LineSeries, { color: 'rgba(167,139,250,0.8)', lineWidth: 1, priceLineVisible: false });
      const lower = chart.addSeries(LineSeries, { color: 'rgba(167,139,250,0.4)', lineWidth: 1, lineStyle: 2, priceLineVisible: false });
      upper.setData(bb.map(b => ({ time: b.time, value: parseFloat(b.upper.toFixed(5)) })));
      mid.setData(bb.map(b   => ({ time: b.time, value: parseFloat(b.middle.toFixed(5)) })));
      lower.setData(bb.map(b => ({ time: b.time, value: parseFloat(b.lower.toFixed(5)) })));
    }

    // Fit content
    chart.timeScale().fitContent();

    // Responsive resize
    const observer = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    observer.observe(containerRef.current);

    return () => { observer.disconnect(); if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; } };
  }, [candles, chartType, indicators.join(','), height]);

  return (
    <div ref={containerRef} style={{ width: '100%', height, background: '#030303' }} />
  );
}
