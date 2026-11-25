const numberFormatter = new Intl.NumberFormat('en', { maximumSignificantDigits: 4 });

export function format(value) {
  if (value !== 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 100000)) {
    return value.toExponential(2);
  }
  return numberFormatter.format(value);
}

export function serializeCsv(headings, rows) {
  const escape = (value) => {
    const field = String(value ?? '');
    return /[,\r\n"]/.test(field) ? `"${field.replaceAll('"', '""')}"` : field;
  };
  return [headings, ...rows].map((row) => row.map(escape).join(',')).join('\r\n') + '\r\n';
}

export function downloadCsv(filename, csv) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Plot modules supply ordered knots. The cursor follows the same polyline
// displayed on screen, including the exact endpoints and regime changes.
export function sampleCurve(points, fraction) {
  const first = points[0];
  const last = points[points.length - 1];
  const x = first.x + fraction * (last.x - first.x);
  if (fraction === 0 || first === last) return first;
  if (fraction === 1) return last;
  const index = points.findIndex((point) => point.x >= x);
  const lower = points[index - 1];
  const upper = points[index];
  const ratio = (x - lower.x) / (upper.x - lower.x);
  return { x, y: lower.y + ratio * (upper.y - lower.y) };
}

export function drawPlot(plot, chosen, containerWidth) {
  const width = Math.min(900, Math.max(260, containerWidth || 670));
  const left = width < 420 ? 65 : 76;
  const right = width - 25;
  const top = 26;
  const bottom = 238;
  const xMin = Math.min(...plot.points.map(({ x }) => x), plot.current?.x ?? Infinity);
  const xMax = Math.max(...plot.points.map(({ x }) => x), plot.current?.x ?? -Infinity);
  const yMin = Math.min(0, ...plot.points.map(({ y }) => y), plot.current?.y ?? Infinity);
  const yMax = Math.max(0, ...plot.points.map(({ y }) => y), plot.current?.y ?? -Infinity);
  const scaleX = (x) => left + (x - xMin) * (right - left) / (xMax - xMin || 1);
  const scaleY = (y) => bottom - (y - yMin) * (bottom - top) / (yMax - yMin || 1);
  const line = plot.points.map(({ x, y }) => `${scaleX(x)},${scaleY(y)}`).join(' ');
  const tickFractions = width < 420 ? [0, 0.5, 1] : [0, 0.25, 0.5, 0.75, 1];
  const grid = tickFractions.map((fraction) => {
    const tickX = xMin + (xMax - xMin) * fraction;
    const tickY = yMin + (yMax - yMin) * fraction;
    const x = scaleX(tickX);
    const y = scaleY(tickY);
    return `<path d="M${left},${y}H${right}" class="lab-chart-grid"/>
      <text x="${left - 8}" y="${y + 4}" text-anchor="end">${format(tickY)}</text>
      <path d="M${x},${bottom}v5" class="lab-chart-axes"/>
      <text x="${x}" y="${bottom + 21}" text-anchor="middle">${format(tickX)}</text>`;
  }).join('');
  const current = plot.current
    ? `<rect class="lab-chart-current" x="-4" y="-4" width="8" height="8"
        transform="translate(${scaleX(plot.current.x)} ${scaleY(plot.current.y)}) rotate(45)"/>`
    : '';
  return `<svg width="${width}" viewBox="0 0 ${width} 299" role="img" aria-labelledby="lab-chart-title lab-chart-desc">
    <title id="lab-chart-title">${plot.title}</title>
    <desc id="lab-chart-desc">${plot.note} Use Read plot value to inspect points on the curve.</desc>
    ${grid}
    <path d="M${left},${top}V${bottom}H${right}" class="lab-chart-axes"/>
    <text x="${(left + right) / 2}" y="288" text-anchor="middle" class="lab-axis-label">${plot.xLabel}</text>
    <text transform="translate(15 ${(top + bottom) / 2}) rotate(-90)" text-anchor="middle" class="lab-axis-label">${plot.yLabel}</text>
    <polyline points="${line}" class="lab-chart-line"/>
    ${current}
    <circle class="lab-chart-sample" cx="${scaleX(chosen.x)}" cy="${scaleY(chosen.y)}" r="5"/>
  </svg>`;
}
