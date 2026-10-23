const HOUR = 3600000;
const CHART_INSET = 30;
const CHART_SLOT_WIDTH = 69;
const valid = value => typeof value === 'number' && Number.isFinite(value);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const number = value => valid(value) ? value.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) : '—';
const rainNumber = value => valid(value) ? value.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) : '—';
const rainDetailNumber = value => valid(value) && value > 0 && value < .005 ? '< 0,01' : rainNumber(value);
const snowLabel = value => (value > 0 && Math.round(value) === 0 ? '< 1' : Math.round(value).toLocaleString('fr-FR')) + ' cm';
const snowPhase = sample => ['snow', 'snow-unknown', 'mixed'].includes(sample.phase || precipitationPhase(sample));
const displayedSnowfall = sample => valid(sample.snowfall) ? snowPhase(sample) ? sample.snowfall : 0 : null;
const rainVisible = value => valid(value) && value >= .01 - 1e-9;
const rainTrace = value => rainVisible(value) && value < .1 - 1e-9;
const rainLabelParts = (group, withUnit = false) => {
  const suffix = group.estimated ? '*' : '';
  if (group.snowfall > 0 && snowPhase(group)) {
    const snow = snowLabel(group.snowfall) + suffix;
    return rainVisible(group.liquidRain) ? [(rainTrace(group.liquidRain) ? 'gouttes' : rainNumber(group.liquidRain) + ' mm') + suffix, snow] : [snow];
  }
  if (['snow', 'snow-unknown', 'mixed'].includes(group.phase)) return ['Neige' + suffix];
  return [(rainTrace(group.rain) ? 'gouttes' : rainNumber(group.rain) + (withUnit ? ' mm' : '')) + suffix];
};
const rainLabelWidth = (group, withUnit = false) => Math.max(28, ...rainLabelParts(group, withUnit).map(text => text.length * 6.5));
const values = (samples, key) => samples.map(sample => sample[key]).filter(valid);

export function precipitationPhase(sample) {
  if (sample.rain === 0 && !(sample.snowfall > 0)) return 'dry';
  // A sub-millimetre snow trace must not announce a snowy period.
  // Decide on the native interval, before clipping or grouping; retain raw amounts.
  if (sample.snowfall > 0 && sample.snowfall < .1
    && ![71, 73, 75, 77, 85, 86].includes(sample.weatherCode)) return sample.liquidRain > 0 ? 'rain' : 'unknown';
  if (sample.snowfall > 0) return sample.liquidRain > 0 ? 'mixed' : sample.liquidRain === 0 ? 'snow' : 'snow-unknown';
  if ([56, 57, 66, 67].includes(sample.weatherCode)) return 'freezing';
  if (sample.snowfall === 0 && sample.liquidRain > 0) return 'rain';
  if ([71, 73, 75, 77, 85, 86].includes(sample.weatherCode)) return 'snow';
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(sample.weatherCode)) return 'rain';
  return sample.rain > 0 ? 'unknown' : null;
}

function precipitationSummary(samples) {
  const wet = samples.filter(sample => sample.rain > 0 || sample.snowfall > 0);
  const representative = wet.reduce((chosen, sample) => !chosen || (sample.rain || 0) > (chosen.rain || 0) ? sample : chosen, null);
  const phases = [...new Set(wet.map(sample => sample.phase || precipitationPhase(sample)).filter(Boolean))];
  return { phase: representative?.phase || (representative ? precipitationPhase(representative)
    : samples.length && samples.every(sample => sample.rain === 0) ? 'dry' : null),
    snowfall: representative?.snowfall ?? null, liquidRain: representative?.liquidRain ?? null,
    phaseDescription: phases.length > 1 ? 'Précipitations de natures différentes selon les créneaux ; pictogramme du créneau le plus intense' : null };
}

export function localDateKey(time, timezone = 'Europe/Paris') {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(time);
}

function localTime(date, hour, timezone) {
  const assumed = Date.parse(date + 'T00:00:00Z') + hour * HOUR;
  let time = assumed;
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  for (let i = 0; i < 3; i++) {
    const p = Object.fromEntries(formatter.formatToParts(time).map(part => [part.type, part.value]));
    const represented = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
    time += assumed - represented;
  }
  return time;
}

function series(hours = [], source) {
  return hours.map(hour => ({ ...hour, source, stamp: Date.parse(hour.time) })).filter(hour => valid(hour.stamp)).sort((a, b) => a.stamp - b.stamp);
}

const forecastSources = (dashboard, week) => [series(dashboard.arome?.hours, 'AROME'), series(week?.hours, 'ARPEGE'), series(dashboard.openMeteo?.hours, 'Open-Meteo')];

function sourceUpdatesMarkup(updates, timezone, now) {
  if (!updates.length) return '';
  const format = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: timezone });
  return `<span class="day-source" aria-label="Sources et dernières mises à jour">${updates.map(source => {
    const stamp = source.fetchedAt instanceof Date ? source.fetchedAt.getTime()
      : typeof source.fetchedAt === 'string' ? Date.parse(source.fetchedAt) : source.fetchedAt;
    if (!valid(stamp) || stamp <= 0) return `<span>${escape(source.name)} · date inconnue</span>`;
    const minutes = Math.floor((now - stamp) / 60000);
    const age = minutes < 0 ? 'date future' : minutes === 0 ? 'à l’instant'
      : minutes < 60 ? `il y a ${minutes}min` : `il y a ${Math.floor(minutes / 60)}h, ${minutes % 60}min`;
    return `<span>${escape(source.name)} · <time datetime="${new Date(stamp).toISOString()}" title="${escape(format.format(stamp))}">${age}</time></span>`;
  }).join(' · ')}</span>`;
}

function weatherPictogram(sample, iconMarkup) {
  const storm = sample.stormSignal === true;
  const phase = sample.phase || precipitationPhase(sample);
  const snow = ['snow', 'mixed', 'snow-unknown'].includes(phase), freezing = phase === 'freezing';
  const phaseLabel = phase === 'mixed' ? 'Pluie et neige sur ce créneau ; simultanéité non précisée'
    : phase === 'snow-unknown' ? 'Neige ; quantité de pluie inconnue' : snow ? 'Neige' : freezing ? 'Pluie verglaçante' : '';
  const cloudCover = valid(sample.cloudCover) ? sample.cloudCover : storm || snow || freezing ? 100 : null;
  const image = valid(cloudCover) ? iconMarkup({ ...sample, cloudCover: snow || freezing ? Math.max(35, cloudCover) : cloudCover,
    ...(snow || freezing || phase === 'unknown' ? { rain: 0, rainLevel: 0 } : {}) }) : '<span class="day-icon-missing">—</span>';
  const snowLevel = sample.snowfall >= 1 ? 3 : sample.snowfall >= .2 ? 2 : 1;
  const phaseImage = snow || freezing ? `<span class="day-phase-icon" role="img" aria-label="${phaseLabel}">${freezing ? '' : image}<img class="day-snow-layer" src="pictogrammes/${freezing ? 'pluie-verglacante' : phase === 'mixed' ? 'calque-pluie-neige' : 'calque-neige-' + snowLevel}.svg" alt="" loading="lazy" decoding="async"></span>` : image;
  const lightning = storm ? '<img class="day-weather-storm" src="pictogrammes/calque-orage.svg" alt="" loading="lazy" decoding="async">' : '';
  return `<span class="weather-icon" data-precipitation-phase="${escape(phase || 'unknown')}"${sample.phaseDescription ? ` title="${escape(sample.phaseDescription)}"` : ''}${storm ? ' role="img" aria-label="Orage possible"' : ''}>${phaseImage}${lightning}</span>`;
}

// Only interpolate continuous fields between acquired points. A gap larger
// than six hours remains unknown; neither rain nor storm signals are smoothed.
function continuous(hours, time, key) {
  const after = hours.findIndex(hour => hour.stamp >= time);
  if (after < 0) return null;
  const right = hours[after];
  if (right.stamp === time) return valid(right[key]) ? right[key] : null;
  const left = hours[after - 1];
  if (!left || right.stamp - left.stamp > 6 * HOUR || !valid(left[key]) || !valid(right[key])) return null;
  if (key === 'windDirection') {
    const difference = ((right[key] - left[key] + 540) % 360) - 180;
    return (left[key] + difference * (time - left.stamp) / (right.stamp - left.stamp) + 360) % 360;
  }
  return left[key] + (right[key] - left[key]) * (time - left.stamp) / (right.stamp - left.stamp);
}

// Keep acquired accumulation periods intact. Lower-priority sources only fill
// uncovered periods; cutting an acquired period is explicitly an estimate.
function nativeRainIntervals(sources) {
  const intervals = [];
  for (const hours of sources) {
    for (const hour of hours) {
      if (!valid(hour.rain)) continue;
      const end = hour.rainIntervalEnd ? Date.parse(hour.rainIntervalEnd) : hour.stamp;
      const start = hour.rainIntervalStart ? Date.parse(hour.rainIntervalStart) : end - HOUR;
      if (!valid(start) || !valid(end) || end <= start) continue;
      const covered = intervals.filter(interval => interval.end > start && interval.start < end).sort((a, b) => a.start - b.start);
      let cursor = start;
      const append = stop => {
        if (stop <= cursor) return;
        intervals.push({ start: cursor, end: stop, rain: Math.max(0, hour.rain) * (stop - cursor) / (end - start),
          liquidRain: valid(hour.liquidRain) ? Math.max(0, hour.liquidRain) * (stop - cursor) / (end - start) : null,
          snowfall: valid(hour.snowfall) && hour.snowfall >= 0 ? hour.snowfall * (stop - cursor) / (end - start) : null,
          phase: precipitationPhase(hour), weatherCode: hour.weatherCode, snowfallMethod: hour.snowfallMethod,
          nativeLiquidRain: hour.liquidRain, nativeSnowfall: hour.snowfall,
          source: hour.source, nativeStart: start, nativeEnd: end, nativeRain: Math.max(0, hour.rain),
          interpolated: hour.source === 'Open-Meteo' && !hour.rainIntervalStart,
          estimated: cursor !== start || stop !== end });
      };
      for (const interval of covered) {
        append(Math.min(end, interval.start));
        cursor = Math.max(cursor, interval.end);
      }
      append(end);
    }
  }
  return intervals.sort((a, b) => a.start - b.start);
}

export function dailyRainBars(day, start = day.start, end = day.end, metric = 'rain') {
  return day.rainIntervals.filter(interval => interval.end > start && interval.start < end
    && (metric !== 'snowfall' || valid(interval.snowfall))).map(interval => {
    const begin = Math.max(start, interval.start), stop = Math.min(end, interval.end);
    const fraction = (stop - begin) / (interval.end - interval.start);
    const amount = metric === 'snowfall' ? displayedSnowfall(interval) : interval.rain;
    return { ...interval, start: begin, end: stop, rain: amount * fraction,
      liquidRain: valid(interval.liquidRain) ? interval.liquidRain * fraction : null,
      snowfall: valid(interval.snowfall) ? interval.snowfall * fraction : null,
      nativeRain: metric === 'snowfall' ? interval.nativeSnowfall : interval.nativeRain,
      estimated: interval.estimated || begin !== interval.start || stop !== interval.end };
  });
}

export function dailyRainScale(days) {
  const maximum = Math.max(10, ...days.flatMap(day => dailyRainBars(day).map(interval => interval.rain * HOUR / (interval.end - interval.start))));
  const power = 10 ** Math.floor(Math.log10(maximum));
  return [1, 2, 5, 10].map(value => value * power).find(value => value >= maximum);
}

// Aggregation is a display choice, never evidence of a model's native step.
// Keep every component so tooltips retain its acquired interval and source.
export function dailyRainDisplayBars(day, width, start = day.start, end = day.end) {
  const { xStamp } = dailyTimeAxis(day, width);
  const groups = [];
  const merge = (left, right) => ({ ...left, end: right.end, rain: left.rain + right.rain,
    snowfall: valid(left.snowfall) && valid(right.snowfall) ? left.snowfall + right.snowfall : null,
    liquidRain: valid(left.liquidRain) && valid(right.liquidRain) ? left.liquidRain + right.liquidRain : null,
    estimated: left.estimated || right.estimated, interpolated: left.interpolated || right.interpolated,
    components: [...left.components, ...right.components] });
  const adjacent = (left, right) => left && left.source === right.source && left.phase === right.phase
    && left.snowfallMethod === right.snowfallMethod && Math.abs(left.end - right.start) < 1;
  for (const interval of dailyRainBars(day, start, end)) {
    const group = { ...interval, components: [interval] }, previous = groups.at(-1);
    if (adjacent(previous, group) && previous.interpolated && group.interpolated
      && Math.floor(previous.start / (3 * HOUR)) === Math.floor((group.end - 1) / (3 * HOUR))) {
      groups[groups.length - 1] = merge(previous, group);
    } else groups.push(group);
  }
  const visible = [];
  const requiredWidth = group => rainLabelWidth(group) + 6;
  for (const group of groups) {
    const previous = visible.at(-1);
    if (adjacent(previous, group) && xStamp(previous.end) - xStamp(previous.start) < requiredWidth(previous)) {
      visible[visible.length - 1] = merge(previous, group);
    } else visible.push(group);
  }
  const last = visible.at(-1), previous = visible.at(-2);
  if (adjacent(previous, last) && xStamp(last.end) - xStamp(last.start) < requiredWidth(last)) {
    visible.splice(-2, 2, merge(previous, last));
  }
  return visible;
}

function stormAt(hours, time) {
  const hour = hours.find(item => item.rainIntervalStart && Date.parse(item.rainIntervalStart) <= time && Date.parse(item.rainIntervalEnd) > time)
    || hours.find(item => item.stamp === time);
  if (!hour) return null;
  if (typeof hour.stormSignal === 'boolean') return Number(hour.stormSignal);
  return valid(hour.weatherCode) ? Number([95, 96, 99].includes(hour.weatherCode)) : null;
}

export function buildDailyRows({ dashboard = {}, week = {}, now = Date.now(), timezone = 'Europe/Paris', count = 16, sunTimesForDate } = {}) {
  const sources = forecastSources(dashboard, week);
  const rainIntervals = nativeRainIntervals(sources);
  const sourceMetadata = { AROME: dashboard.arome, ARPEGE: week, 'Open-Meteo': dashboard.openMeteo };
  const today = localDateKey(now, timezone);
  const limit = localDateKey(localTime(today, 24 * count, timezone), timezone);
  const coveredTimes = [...sources.flat().map(hour => hour.stamp), ...rainIntervals.flatMap(interval => [interval.start, interval.end - 1])];
  const dates = [...new Set(coveredTimes.map(time => localDateKey(time, timezone)))].filter(date => date >= today && date < limit).sort();
  return dates.map(date => {
    const midnight = localTime(date, 0, timezone), end = localTime(date, 24, timezone);
    const start = midnight;
    const pastUntil = date === today ? Math.min(end, Math.max(start, now)) : start;
    const sampleAt = time => {
      const stamp = time, intervalEnd = time + HOUR;
      const sample = { time: new Date(stamp).toISOString(), stamp, intervalEnd, durationHours: (intervalEnd - stamp) / HOUR, past: intervalEnd <= pastUntil, sources: {} };
      const rain = dailyRainBars({ rainIntervals }, stamp, intervalEnd);
      sample.rain = rain.reduce((sum, interval) => sum + interval.end - interval.start, 0) >= HOUR - 1
        ? rain.reduce((sum, interval) => sum + interval.rain, 0) : null;
      sample.rainSources = [...new Set(rain.map(interval => interval.source))];
      Object.assign(sample, precipitationSummary(rain));
      // The summary chooses a phase, not the amount of a representative fragment.
      for (const key of ['liquidRain', 'snowfall']) sample[key] = rain.length && valid(sample.rain) && rain.every(interval => valid(interval[key]))
        ? rain.reduce((sum, interval) => sum + interval[key], 0) : null;
      if (valid(sample.rain)) sample.sources.rain = sample.rainSources.join(' · ');
      for (const key of ['temperature', 'cloudCover', 'windSpeed', 'windGust', 'windDirection', 'storm']) {
        sample[key] = null;
        for (const hours of sources) {
          const value = key === 'storm' ? stormAt(hours, time) : continuous(hours, stamp, key);
          if (!valid(value)) continue;
          sample[key] = value;
          sample.sources[key] = hours[0].source;
          break;
        }
      }
      return sample;
    };
    const samples = [];
    for (let time = midnight; time < end; time += HOUR) samples.push(sampleAt(time));
    const boundary = sampleAt(end);
    // Compressed nights can expose more adjacent hours inside the chart inset.
    const contextBefore = Array.from({ length: 24 }, (_, index) => sampleAt(start - (24 - index) * HOUR));
    const contextAfter = Array.from({ length: 24 }, (_, index) => sampleAt(end + (index + 1) * HOUR));
    const sourceLabels = [...new Set([...samples, boundary].flatMap(sample => [
      ...Object.entries(sample.sources).filter(([key]) => key !== 'rain').map(([, name]) => name), ...sample.rainSources]))];
    const sun = sunTimesForDate?.(new Date((start + end) / 2));
    return { date, midnight, start, end, pastUntil, samples, boundary, contextBefore, contextAfter, rainIntervals,
      sunrise: sun?.sunrise?.valueOf(), sunset: sun?.sunset?.valueOf(),
      sources: sourceLabels, sourceUpdates: sourceLabels.map(name => ({ name, fetchedAt: sourceMetadata[name]?.fetchedAt ?? null })),
      trend: Date.parse(date) - Date.parse(today) >= 8 * 24 * HOUR };
  }).filter(day => day.sources.length);
}

function extent(samples, key, fallback) {
  const entries = values(samples, key);
  return entries.length ? [Math.min(...entries), Math.max(...entries)] : fallback;
}

export function createDailyChartState() {
  return { showHourly: false,
    opacities: { temperature: 100, rain: 100, cloudiness: 0, wind: 0, gust: 0 },
    offsets: { temperature: 0, rain: 0, cloudiness: 0, wind: 0, gust: 0 } };
}

function compressedTimeIntervals(day, width = Infinity) {
  if (!valid(day.sunrise) || !valid(day.sunset) || day.sunrise >= day.sunset) return null;
  const firstDayHour = Math.min(day.end, Math.max(day.start, day.start + Math.ceil((day.sunrise - day.start) / HOUR) * HOUR));
  const lastDayHour = Math.max(firstDayHour, Math.min(day.end, day.start + Math.floor((day.sunset - day.start) / HOUR) * HOUR));
  const intervals = [];
  const night = (start, end) => {
    const hours = Math.round((end - start) / HOUR), count = Math.max(1, Math.floor(hours / 3));
    for (let i = 0; i < count && hours > 0; i++) {
      intervals.push({ start: start + Math.round(i * hours / count) * HOUR,
        end: start + Math.round((i + 1) * hours / count) * HOUR });
    }
  };
  night(day.start, firstDayHour);
  for (let time = firstDayHour; time < lastDayHour; time += HOUR) intervals.push({ start: time, end: time + HOUR });
  night(lastDayHour, day.end);
  const count = Math.min(intervals.length, Math.max(1, Math.floor((width - 2 * CHART_INSET) / CHART_SLOT_WIDTH)));
  return Array.from({ length: count }, (_, i) => ({ start: intervals[Math.round(i * intervals.length / count)].start,
    end: intervals[Math.round((i + 1) * intervals.length / count) - 1].end }));
}

export function dailyHourlyWidth(day) {
  const intervals = compressedTimeIntervals(day);
  return Math.ceil(2 * CHART_INSET + (intervals?.length ?? (day.end - day.start) / HOUR) * CHART_SLOT_WIDTH);
}

export function dailyChartSize(viewportWidth, state = createDailyChartState(), day) {
  const viewport = Math.max(160, Math.round(viewportWidth));
  const hourlyWidth = day ? dailyHourlyWidth(day) : viewport;
  const canExpand = hourlyWidth > viewport;
  return { width: state.showHourly && canExpand ? hourlyWidth : viewport, canExpand,
    height: Math.max(220, Math.min(300, Math.round(160 + viewport * .1))) };
}

// Monotone Hermite time mapping: equal-width columns, with a continuous clock
// speed at their boundaries. Harmonic tangents preserve order without overshoot.
export function dailyTimeAxis(day, width) {
  const compressed = compressedTimeIntervals(day, width);
  const intervals = compressed || [{ start: day.start, end: day.end }];
  const durations = intervals.map(interval => interval.end - interval.start);
  const linear = durations.every(duration => duration === durations[0]);
  const tangents = [durations[0], ...durations.slice(1).map((duration, index) =>
    2 * duration * durations[index] / (duration + durations[index])), durations.at(-1)];
  const timeInColumn = (index, u) => intervals[index].start
    + (u ** 3 - 2 * u ** 2 + u) * tangents[index]
    + (-2 * u ** 3 + 3 * u ** 2) * durations[index]
    + (u ** 3 - u ** 2) * tangents[index + 1];
  const fraction = time => {
    if (linear) return (time - day.start) / (day.end - day.start);
    if (time <= day.start) return (time - day.start) / durations[0] / intervals.length;
    if (time >= day.end) return 1 + (time - day.end) / durations.at(-1) / intervals.length;
    const index = intervals.findIndex(interval => time < interval.end);
    if (time === intervals[index].start) return index / intervals.length;
    let low = 0, high = 1;
    for (let step = 0; step < 40; step++) {
      const middle = (low + high) / 2;
      if (timeInColumn(index, middle) < time) low = middle;
      else high = middle;
    }
    return (index + (low + high) / 2) / intervals.length;
  };
  const xStamp = time => CHART_INSET + fraction(time) * (width - 2 * CHART_INSET);
  const positionAt = x => (x - CHART_INSET) / (width - 2 * CHART_INSET) * intervals.length;
  const timeAt = x => {
    if (linear) return day.start + (x - CHART_INSET) / (width - 2 * CHART_INSET) * (day.end - day.start);
    const position = positionAt(x);
    if (position <= 0) return day.start + position * durations[0];
    if (position >= intervals.length) return day.end + (position - intervals.length) * durations.at(-1);
    const index = Math.floor(position);
    return timeInColumn(index, position - index);
  };
  const millisecondsPerPixel = x => {
    if (linear) return (day.end - day.start) / (width - 2 * CHART_INSET);
    const position = positionAt(x), pixelsPerColumn = (width - 2 * CHART_INSET) / intervals.length;
    if (position <= 0) return durations[0] / pixelsPerColumn;
    if (position >= intervals.length) return durations.at(-1) / pixelsPerColumn;
    const index = Math.floor(position), u = position - index;
    return ((3 * u ** 2 - 4 * u + 1) * tangents[index]
      + (-6 * u ** 2 + 6 * u) * durations[index]
      + (3 * u ** 2 - 2 * u) * tangents[index + 1]) / pixelsPerColumn;
  };
  return { xStamp, timeAt, fraction, millisecondsPerPixel, compressed: !!compressed };
}

export function dailyTimeGroups(day, width) {
  const slots = Math.max(1, Math.floor((width - 2 * CHART_INSET) / CHART_SLOT_WIDTH));
  const intervalsFor = step => {
    const intervals = [], anchor = day.midnight ?? day.start;
    let start = day.start;
    while (start < day.end) {
      let end = Math.min(day.end, anchor + (Math.floor((start - anchor) / (step * HOUR)) + 1) * step * HOUR);
      // Merge a tiny current-hour fragment with the next interval. This keeps
      // labels readable and every rain sample inside its displayed window.
      if (start === day.start && end - start < step * HOUR / 2 && end < day.end) end = Math.min(day.end, end + step * HOUR);
      intervals.push({ start, end });
      start = end;
    }
    return intervals;
  };
  const step = [1, 2, 3, 4, 6, 8, 12, 24].find(value => intervalsFor(value).length <= slots) || 24;
  const intervals = compressedTimeIntervals(day, width) || intervalsFor(step);
  const groups = [];
  for (const { start, end } of intervals) {
    const samples = day.samples.filter(sample => sample.stamp >= start && sample.stamp < end);
    if (!samples.length) continue;
    const rains = values(samples, 'rain'), clouds = values(samples, 'cloudCover');
    groups.push({ start, end, samples, index: day.samples.indexOf(samples[0]),
      rain: rains.length ? rains.reduce((sum, value) => sum + value, 0) : null,
      completeRain: rains.length === samples.length,
      cloudCover: clouds.length ? clouds.reduce((sum, value) => sum + value, 0) / clouds.length : null,
      storm: samples.some(sample => sample.storm === 1) });
  }
  return { step, groups };
}

export function dailyCurveSamples(day, width) {
  const axis = dailyTimeAxis(day, width), start = axis.timeAt(0), end = axis.timeAt(width);
  const context = [...(day.contextBefore || []), ...day.samples, ...(day.boundary ? [day.boundary] : []), ...(day.contextAfter || [])];
  const times = new Set([start, end, ...context.filter(sample => sample.stamp >= start && sample.stamp <= end).map(sample => sample.stamp),
    ...(compressedTimeIntervals(day, width) || []).flatMap(interval => [interval.start, interval.end]),
    ...[day.sunrise, day.sunset].filter(time => valid(time) && time >= start && time <= end)]);
  return [...times].sort((a, b) => a - b).map(stamp => {
    const acquired = context.find(sample => sample.stamp === stamp);
    if (acquired) return acquired;
    const sample = { stamp, time: new Date(stamp).toISOString(), sources: {} };
    for (const key of ['temperature', 'cloudCover', 'windSpeed', 'windGust']) sample[key] = continuous(context, stamp, key);
    return sample;
  });
}

export function dailyChartMarkup(day, { now = Date.now(), state = createDailyChartState(), width = 1000, viewportWidth = width, rainScale = dailyRainScale([day]), timezone = 'Europe/Paris', iconMarkup = () => '', backgroundForTime = () => '#f7fafc' } = {}) {
  width = Math.max(160, Math.round(width));
  const { height } = dailyChartSize(viewportWidth, state);
  const axis = dailyTimeAxis(day, width), { xStamp, timeAt } = axis;
  const { step, groups } = dailyTimeGroups(day, width);
  const selected = new Set(groups.map(group => day.samples[group.index].stamp));
  const dayCurveSamples = day.boundary ? [...day.samples, day.boundary] : day.samples;
  if (day.boundary) selected.add(day.boundary.stamp);
  const context = [...(day.contextBefore || []), ...dayCurveSamples, ...(day.contextAfter || [])];
  const edgeStart = timeAt(0), edgeEnd = timeAt(width);
  const edgeSample = stamp => {
    const sample = { stamp, time: new Date(stamp).toISOString(), sources: {} };
    for (const key of ['temperature', 'cloudCover', 'windSpeed', 'windGust']) sample[key] = continuous(context, stamp, key);
    return sample;
  };
  const solarSamples = [day.sunrise, day.sunset].filter(time => valid(time) && time > day.start && time < day.end
    && !dayCurveSamples.some(sample => sample.stamp === time)).map(edgeSample);
  const curveSamples = dailyCurveSamples(day, width);
  const top = 94, bottom = height - 24;
  const x = index => xStamp(curveSamples[index].stamp);
  const domain = extent(curveSamples, 'temperature', [0, 20]);
  const padding = Math.max(1.5, (domain[1] - domain[0]) * .2);
  const yTemperature = value => bottom - (value - domain[0] + padding) / (domain[1] - domain[0] + 2 * padding) * (bottom - top);
  const rainGroups = [...dailyRainDisplayBars(day, width, edgeStart, day.start).map(interval => ({ ...interval, edge: true })),
    ...dailyRainDisplayBars(day, width), ...dailyRainDisplayBars(day, width, day.end, edgeEnd).map(interval => ({ ...interval, edge: true }))];
  const hasSnow = rainGroups.some(snowPhase);
  const phaseKnown = rainGroups.every(group => !(group.rain > 0) || valid(group.liquidRain));
  const windMax = Math.max(20, Math.ceil(Math.max(extent(curveSamples, 'windGust', [0, 0])[1], extent(curveSamples, 'windSpeed', [0, 0])[1]) / 10) * 10);
  const ys = { temperature: yTemperature, wind: value => bottom - value / windMax * (bottom - top),
    gust: value => bottom - value / windMax * (bottom - top), cloudiness: value => bottom - value / 100 * (bottom - top) };
  const keys = { temperature: 'temperature', wind: 'windSpeed', gust: 'windGust', cloudiness: 'cloudCover' };
  const labels = { temperature: 'Température', rain: 'Précipitations', wind: 'Vent moyen', gust: 'Rafales', cloudiness: 'Nébulosité' };
  const units = { temperature: '°C', rain: 'mm sur 1 h', wind: 'km/h', gust: 'km/h', cloudiness: '%' };
  const timeFormat = new Intl.DateTimeFormat('fr-FR', { timeZone: timezone, hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
  const layer = (metric, content, extra = '') => {
    const opacity = state.opacities[metric] / 100;
    return `<g class="day-combined-layer metric-layer metric-layer-${metric}${extra}" data-day-layer="${metric}" style="${opacity ? '' : 'display:none;'}" aria-hidden="${!opacity}">${content}</g>`;
  };
  const tooltip = (sample, metric) => timeFormat.format(sample.stamp) + (sample.past ? ' · prévision passée' : '') + '\n' + labels[metric] + ' : '
    + number(sample[keys[metric] || metric]) + ' ' + units[metric]
    + '\n' + (sample.sources[keys[metric] || metric] || '');
  const point = (sample, metric, content) => `<g class="chart-point" tabindex="${state.opacities[metric] ? 0 : -1}" data-tooltip="${escape(tooltip(sample, metric))}" aria-label="${escape(tooltip(sample, metric))}">${content}</g>`;
  // Evaluate daylight in real time, including the neighboring-day margins,
  // then project every stop through the same compressed axis as the curves.
  const lightId = 'daily-light-' + day.date;
  const lightTimes = new Set([edgeStart, edgeEnd, day.start, day.end, ...solarSamples.map(sample => sample.stamp)]);
  for (let time = Math.ceil(edgeStart / (HOUR / 4)) * HOUR / 4; time < edgeEnd; time += HOUR / 4) lightTimes.add(time);
  const lightStops = [...lightTimes].sort((a, b) => a - b).map(time => `<stop offset="${time === edgeStart ? 0 : time === edgeEnd ? 100 : xStamp(time) / width * 100}%" stop-color="${escape(backgroundForTime(time))}"/>`).join('');
  const backgrounds = `<defs><linearGradient id="${lightId}" gradientUnits="userSpaceOnUse" x1="0" x2="${width}" y1="0" y2="0">${lightStops}</linearGradient></defs><rect class="day-daylight-background" width="${width}" height="${height}" fill="url(#${lightId})"/>`
    + groups.map(group => `<line x1="${xStamp(group.start)}" x2="${xStamp(group.start)}" y1="0" y2="${height}" class="day-combined-grid"/>`).join('');
  const curveCommand = (from, to, key, y) => {
    const left = curveSamples[from], right = curveSamples[to], x0 = x(from), x1 = x(to);
    if (!axis.compressed) return `L${x1},${y(right[key])}`;
    // Values remain linear in real time. Composing with the cubic clock gives
    // an exact Bezier, without an angular shortcut through compressed columns.
    const third = (x1 - x0) / 3, slope = (y(right[key]) - y(left[key])) / (right.stamp - left.stamp);
    return `C${x0 + third},${y(left[key]) + slope * axis.millisecondsPerPixel(x0) * third} `
      + `${x1 - third},${y(right[key]) - slope * axis.millisecondsPerPixel(x1) * third} ${x1},${y(right[key])}`;
  };
  const continuousLayer = metric => {
    const key = keys[metric], y = ys[metric];
    let path = '', previous = null;
    for (let index = 0; index < curveSamples.length; index++) {
      const sample = curveSamples[index];
      if (!valid(sample[key])) { previous = null; continue; }
      if (previous) path += `<path class="day-combined-line" d="M${x(previous.index)},${y(previous.sample[key])} ${curveCommand(previous.index, index, key, y)}"/>`;
      previous = { sample, index };
    }
    const points = curveSamples.map((sample, index) => valid(sample[key]) && selected.has(sample.stamp) ? point(sample, metric,
      `<circle cx="${x(index)}" cy="${y(sample[key])}" r="3"/><text x="${x(index)}" y="${y(sample[key]) - 10}" text-anchor="middle">${metric === 'temperature' ? number(sample[key]) + '°' : number(Math.round(sample[key])) + (metric === 'cloudiness' ? '%' : '')}</text>`) : '').join('');
    return layer(metric, path + points);
  };
  // As on the 48 h timeline, cloud cover is a translucent area without a
  // stroke or visible markers. Missing readings split the area into pieces.
  let cloudAreas = '', cloudSegment = [];
  const finishCloudArea = () => {
    if (cloudSegment.length > 1) {
      const first = cloudSegment[0], last = cloudSegment.at(-1);
      const left = x(first.index);
      const right = x(last.index);
      const points = [[left, bottom], [left, ys.cloudiness(first.sample.cloudCover)],
        ...cloudSegment.map(({ sample, index }) => [x(index), ys.cloudiness(sample.cloudCover)]),
        [right, ys.cloudiness(last.sample.cloudCover)], [right, bottom]];
      if (axis.compressed) {
        const outline = cloudSegment.slice(1).map((point, i) => curveCommand(cloudSegment[i].index, point.index, 'cloudCover', ys.cloudiness)).join(' ');
        cloudAreas += `<path class="cloud-cover-overlay" d="M${left},${bottom} L${left},${ys.cloudiness(first.sample.cloudCover)} ${outline} L${right},${bottom} Z"/>`;
      } else cloudAreas += `<polygon class="cloud-cover-overlay" points="${points.map(point => point.join(',')).join(' ')}"/>`;
    }
    cloudSegment = [];
  };
  curveSamples.forEach((sample, index) => {
    if (valid(sample.cloudCover)) cloudSegment.push({ sample, index });
    else finishCloudArea();
  });
  finishCloudArea();
  const cloudiness = layer('cloudiness', cloudAreas + groups.map(group => {
    const sample = day.samples[group.index];
    return valid(sample.cloudCover) ? point(sample, 'cloudiness', `<rect x="${xStamp(group.start)}" y="${top}" width="${xStamp(group.end) - xStamp(group.start)}" height="${bottom - top}" fill="transparent"/>`) : '';
  }).join(''));
  let previousRainLabel = null;
  const rain = layer('rain', rainGroups.map(group => {
    if (!rainVisible(group.rain)) return '';
    const hours = (group.end - group.start) / HOUR, rate = group.rain / hours;
    // Quantified rain grows linearly above the minimum reserved for traces.
    const proportionalHeight = rate / rainScale * 67;
    const trace = rainTrace(group.rain) && !snowPhase(group);
    const bar = trace ? 5 : 5 + Math.min(67, proportionalHeight);
    const left = xStamp(group.start), right = xStamp(group.end), center = (left + right) / 2;
    const acquired = group.components.map(part => 'Cumul ' + (part.interpolated ? 'API horaire' : 'source') + ' : ' + rainDetailNumber(part.nativeRain) + ' mm sur '
      + number((part.nativeEnd - part.nativeStart) / HOUR) + ' h (' + timeFormat.format(part.nativeStart) + ' – ' + timeFormat.format(part.nativeEnd) + ')').join('\n');
    const detail = timeFormat.format(group.start) + ' – ' + timeFormat.format(group.end) + '\nPrécipitations : ' + rainDetailNumber(group.rain) + ' mm sur ' + number(hours) + ' h'
      + (group.estimated ? ' (part estimée au prorata)' : '') + '\nIntensité moyenne : ' + rainDetailNumber(rate) + ' mm/h'
      + (group.components.length > 1 ? '\nCumul agrégé pour l’affichage' : '')
      + (group.interpolated ? '\nOpen-Meteo : données horaires interpolées ; pas natif non communiqué' : '')
      + (trace ? '\nGouttes : repère fixe de 5 px, hors échelle d’intensité' : '')
      + '\n' + acquired + '\n' + group.source
      + (valid(group.liquidRain) ? '\nPluie liquide : ' + rainDetailNumber(group.liquidRain) + ' mm' : '\nRépartition pluie/neige non disponible ; cumul en équivalent eau')
      + (group.snowfall > 0 ? snowPhase(group)
        ? '\nNeige fraîche estimée : ' + snowLabel(group.snowfall) + ' ; pas une hauteur de neige au sol'
        : '\nTrace neigeuse infime non représentée (moins de 0,1 cm sur le créneau source)' : '')
      + (group.snowfall > 0 ? '\nHauteur du diagramme : intensité en équivalent eau, même échelle que la pluie' : '')
      + (group.snowfall > 0 && group.snowfallMethod === 'water-equivalent-0.7' ? '\nEstimation conventionnelle : 0,7 cm par mm d’équivalent eau neigeux (convention Open-Meteo)' : '')
      + (group.snowfall > 0 && group.snowfallMethod === 'provider-estimate' ? '\nHauteur fraîche estimée fournie par Open-Meteo' : '')
      + (group.phase === 'mixed' ? '\nPluie et neige dans le même créneau source ; simultanéité non précisée' : '');
    const gap = group.edge ? 0 : Math.min(3, (right - left) * .1);
    const withUnit = !rainTrace(group.rain) && right - left - gap * 2 >= rainLabelWidth(group, true) + 6;
    const labelWidth = rainLabelWidth(group, withUnit);
    const labelParts = rainLabelParts(group, withUnit), labelHeight = labelParts.length > 1 ? 30 : 18;
    const labelX = Math.max(labelWidth / 2 + 2, Math.min(width - labelWidth / 2 - 2, center));
    let labelY = height - 7 - bar;
    if (previousRainLabel && labelX - labelWidth / 2 < previousRainLabel.right + 3 && Math.abs(labelY - previousRainLabel.y) < Math.max(labelHeight, previousRainLabel.height)) labelY = previousRainLabel.y - previousRainLabel.height - 2;
    if (!group.edge) previousRainLabel = { right: labelX + labelWidth / 2, y: labelY, height: labelHeight };
    const labelContent = labelParts.length === 1 ? escape(labelParts[0]) : labelParts.map((text, index) => `<tspan x="${labelX}" dy="${index ? 13 : -13}">${escape(text)}</tspan>`).join('');
    const label = `<text class="day-rain-label" x="${labelX}" y="${labelY}" text-anchor="middle">${labelContent}</text>`;
    const phaseClass = group.snowfall > 0 && snowPhase(group) ? group.liquidRain > 0 ? ' day-combined-mixed' : ' day-combined-snow' : '';
    const snowHatch = group.snowfall > 0 && snowPhase(group) ? `<rect x="${left + gap}" y="${height - bar}" width="${Math.max(.1, right - left - gap * 2)}" height="${bar}" fill="url(#daily-snow-${day.date})" pointer-events="none"/>` : '';
    return `<g class="chart-point${phaseClass}"${group.edge ? ' data-adjacent-day="true"' : ''} data-rain-amount="${group.rain}" data-rain-rate="${rate}" data-rain-hours="${hours}" tabindex="${state.opacities.rain ? 0 : -1}" data-tooltip="${escape(detail)}" aria-label="${escape(detail)}"><rect x="${left + gap}" y="${height - bar}" width="${Math.max(.1, right - left - gap * 2)}" height="${bar}" class="day-combined-rain${group.edge ? ' day-adjacent-rain' : ''}"/>${snowHatch}${group.edge ? '' : label}</g>`;
  }).join(''));
  const tickFormat = new Intl.DateTimeFormat('fr-FR', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  // Hours and pictograms share a fixed column, as on the Tatins timeline.
  // Moving or hiding the temperature curve does not move or hide this header.
  const evening = day.pastUntil >= localTime(day.date, 18, timezone) && day.pastUntil < day.end
    && !groups.some(group => group.start >= day.pastUntil);
  // Keep a colored pictogram for the remaining evening, even when the
  // remaining time is narrower than the icon itself. It is above the past mask.
  let eveningHeader = '';
  if (evening) {
    const remaining = day.samples.filter(sample => sample.intervalEnd > day.pastUntil);
    const rainHours = remaining.reduce((sum, sample) => sum + (sample.intervalEnd - Math.max(sample.stamp, day.pastUntil)) / HOUR, 0);
    const rain = remaining.every(sample => valid(sample.rain)) && rainHours > 0
      ? remaining.reduce((sum, sample) => sum + sample.rain * (sample.intervalEnd - Math.max(sample.stamp, day.pastUntil)) / (sample.intervalEnd - sample.stamp), 0) / rainHours : null;
    const sample = { ...precipitationSummary(remaining), time: new Date(day.pastUntil).toISOString(), cloudCover: continuous(curveSamples, day.pastUntil, 'cloudCover'), rain,
      stormSignal: remaining.some(sample => sample.storm === 1) };
    const center = Math.min(width - 35, Math.max(35, xStamp((day.pastUntil + day.end) / 2)));
    eveningHeader = `<div class="day-evening-header"><div class="day-timeline-slot day-evening-slot" style="left:${center / width * 100}%"><time datetime="${sample.time}" title="De ${escape(timeFormat.format(day.pastUntil))} à minuit">Ce soir</time>${weatherPictogram(sample, iconMarkup)}</div></div>`;
  }
  const header = groups.filter(group => !evening || group !== groups.at(-1)).map(group => {
    const sample = day.samples[group.index];
    const iconSample = { ...sample, ...precipitationSummary(group.samples), cloudCover: valid(group.cloudCover) ? group.cloudCover : group.storm ? 100 : null, stormSignal: group.storm, rain: valid(group.rain) ? group.rain / ((group.end - group.start) / HOUR) : null };
    const label = tickFormat.format(group.start).replace(':00', 'h').replace(':', 'h');
    return `<div class="day-timeline-slot" style="left:${xStamp(group.start) / width * 100}%"><time datetime="${sample.time}">${label}</time>${weatherPictogram(iconSample, iconMarkup)}</div>`;
  }).join('');
  const caption = `<span class="day-chart-scale" data-day-layer="temperature"${state.opacities.temperature ? '' : ' style="display:none"'}>Température °C</span><span class="day-chart-scale" data-day-layer="rain"${state.opacities.rain ? '' : ' style="display:none"'}>Pluie mm/h</span><span class="day-chart-scale" data-day-layer="wind"${state.opacities.wind ? '' : ' style="display:none"'}>Vent km/h</span><span class="day-chart-scale" data-day-layer="gust"${state.opacities.gust ? '' : ' style="display:none"'}>Rafales km/h</span><span class="day-chart-scale" data-day-layer="cloudiness"${state.opacities.cloudiness ? '' : ' style="display:none"'}>Nébulosité %</span>`;
  const pastPosition = day.pastUntil > day.start ? xStamp(Math.min(day.end, day.pastUntil)) / width * 100 : 0;
  const history = pastPosition ? `<div class="day-elapsed-mask" style="width:${pastPosition}%" aria-hidden="true"></div><div class="day-now-marker" style="left:${pastPosition}%" role="note" aria-label="Maintenant : ${escape(timeFormat.format(day.pastUntil))}"></div>` : '';
  const sources = sourceUpdatesMarkup(day.sourceUpdates || day.sources.map(name => ({ name })), timezone, now);
  const precipCaption = hasSnow || !phaseKnown ? `Précip. 0–${number(rainScale)} mm/h équiv. eau · cumuls mm${hasSnow ? ' / neige cm' : ''}` : `Pluie 0–${number(rainScale)} mm/h · cumuls mm`;
  const hatch = `<defs><pattern id="daily-snow-${day.date}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" x2="0" y1="0" y2="6" stroke="white" stroke-opacity=".65" stroke-width="2"/></pattern></defs>`;
  return `<div class="day-chart-key">${caption.replace('Pluie mm/h', precipCaption)}<span class="day-key-spacer" aria-hidden="true"></span>${sources}</div><div class="day-combined-canvas" data-display-step="${step}" style="height:${height}px"><svg class="day-combined-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="group" aria-label="Frise météo du ${day.date}">${hatch}${backgrounds}${cloudiness}${rain}${continuousLayer('wind')}${continuousLayer('gust')}${continuousLayer('temperature')}</svg><div class="day-timeline-header">${header}${evening ? '' : `<time class="day-timeline-end" style="left:${xStamp(day.end) / width * 100}%">24h</time>`}</div>${history}${eveningHeader}</div>`;
}

export function dailySummarySample(day) {
  const hasSun = valid(day.sunrise) && valid(day.sunset) && day.sunrise < day.sunset;
  const start = hasSun ? Math.max(day.start, day.sunrise) : day.start;
  const end = hasSun ? Math.min(day.end, day.sunset) : day.end;
  let clouds = 0, duration = 0;
  for (const sample of day.samples) {
    const overlap = Math.max(0, Math.min(end, sample.intervalEnd) - Math.max(start, sample.stamp));
    if (!valid(sample.cloudCover) || !overlap) continue;
    clouds += sample.cloudCover * overlap;
    duration += overlap;
  }
  // Represent the most persistent phase, not a brief precipitation maximum.
  const phases = new Map();
  for (const sample of day.samples) {
    const weight = Math.max(0, Math.min(day.end, sample.intervalEnd) - Math.max(day.start, sample.stamp));
    if (!valid(sample.rain) || !weight) continue;
    const phase = sample.phase || precipitationPhase(sample);
    const group = phases.get(phase) || { phase, weight: 0, samples: [] };
    group.weight += weight;
    group.samples.push({ sample, weight });
    phases.set(phase, group);
  }
  const dominant = [...phases.values()].sort((a, b) => b.weight - a.weight || (a.phase === 'dry' ? -1 : b.phase === 'dry' ? 1 : 0))[0];
  let representative = null, elapsed = 0;
  if (dominant) for (const item of dominant.samples.sort((a, b) => a.sample.rain - b.sample.rain)) {
    elapsed += item.weight;
    if (elapsed >= dominant.weight / 2) { representative = item.sample; break; }
  }
  return { ...precipitationSummary(representative ? [representative] : day.samples), time: new Date((start + end) / 2).toISOString(), cloudCover: duration ? clouds / duration : null,
    rain: representative?.rain ?? null,
    stormSignal: day.samples.some(sample => sample.storm === 1) };
}

export function dailyRowsMarkup(days, { now = Date.now(), timezone = 'Europe/Paris', rainScale = dailyRainScale(days), iconMarkup = () => '', controlsMarkup = () => '', stateForDate = () => createDailyChartState(), backgroundForTime } = {}) {
  if (!days.length) return '<p class="week-source-message">Prévisions en attente d’actualisation.</p>';
  const today = localDateKey(now, timezone);
  const weekday = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', timeZone: timezone });
  const shortDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: timezone });
  const renderChart = (day, state) => dailyChartMarkup(day, { now, state, rainScale, timezone, iconMarkup, backgroundForTime });
  const rows = days.map(day => {
    const state = stateForDate(day.date);
    const temps = extent(day.boundary ? [...day.samples, day.boundary] : day.samples, 'temperature', [null, null]), rains = dailyRainBars(day);
    const separated = rains.every(interval => valid(interval.liquidRain));
    const rainTotal = rains.length ? rains.reduce((sum, interval) => sum + (separated ? interval.liquidRain : interval.rain), 0) : null;
    const rainPartial = rains.reduce((sum, interval) => sum + interval.end - interval.start, 0) < day.end - day.start - 1;
    const rainEstimated = rains.some(interval => interval.rain > 0 && interval.estimated);
    const label = day.date === today ? 'Aujourd’hui' : weekday.format(day.start);
    const rainSummary = valid(rainTotal) && !rainVisible(rainTotal) ? '' : `<span class="daily-period-rain-volume" title="${separated ? 'Cumul de pluie liquide' : 'Précipitations totales en équivalent eau ; répartition pluie/neige inconnue'} de la journée${rainEstimated ? ' ; * partiellement estimé au prorata des intervalles source' : ''}">${separated ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8C9.5 6.4 6.8 9.7 6.8 13.2a5.2 5.2 0 0 0 10.4 0C17.2 9.7 14.5 6.4 12 2.8Z"/></svg>' : '<small>Précip.</small>'}<strong>${rainNumber(rainTotal)} mm${rainEstimated ? '*' : ''}${rainPartial ? ' (partiel)' : ''}</strong></span>`;
    const snowIntervals = rains.filter(interval => valid(interval.snowfall));
    const snowTotal = snowIntervals.reduce((sum, interval) => sum + displayedSnowfall(interval), 0);
    const snowPartial = snowIntervals.reduce((sum, interval) => sum + interval.end - interval.start, 0) < day.end - day.start - 1;
    const snowEstimated = snowIntervals.some(interval => interval.snowfall > 0 && interval.estimated);
    const snowSummary = snowTotal > 0 ? `<span class="day-snow-volume" title="Neige fraîche estimée de la journée ; pas une hauteur au sol${snowPartial ? ' ; couverture partielle' : ''}${snowEstimated ? ' ; * part estimée au prorata' : ''}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v20M3.34 7l17.32 10M3.34 17 20.66 7M9 4l3 3 3-3M9 20l3-3 3 3M3.5 10.5l4.1-1.1-1.1-4.1M17.5 18.7l-1.1-4.1 4.1-1.1M6.5 18.7l1.1-4.1-4.1-1.1M20.5 10.5l-4.1-1.1 1.1-4.1"/></svg><strong>${escape(snowLabel(snowTotal))}${snowEstimated ? '*' : ''}${snowPartial ? ' (partiel)' : ''}</strong></span>` : '';
    const summary = `<div class="day-summary"><span class="daily-period-temperatures"><span><small>Min.</small><b>${number(temps[0])}°</b></span><span><small>Max.</small><strong>${number(temps[1])}°</strong></span></span>${rainSummary}${snowSummary}</div>`;
    return `<article class="forecast-day-row${day.trend ? ' forecast-day-trend' : ''}" data-day-date="${day.date}" aria-label="${escape(label + ' ' + shortDate.format(day.start))}"><header class="forecast-day-header"><div class="day-date-heading"><h3>${escape(label)}</h3><time datetime="${day.date}">${escape(shortDate.format(day.start))}</time>${day.trend ? '<span class="day-trend-label">Tendance</span>' : ''}</div><div class="day-summary-icon" role="img" aria-label="Résumé météo du ${day.date}" title="Résumé météo de la journée">${weatherPictogram(dailySummarySample(day), iconMarkup)}</div>${summary}<label class="day-width-control" hidden title="Une heure par créneau en journée, nuit comprimée"><input type="checkbox"${state.showHourly ? ' checked' : ''} aria-label="Afficher le détail heure par heure du ${day.date}">Afficher le détail heure par heure</label></header><div class="day-combined-body">${controlsMarkup(state.opacities)}<div class="day-chart-scroll" role="region" tabindex="0" aria-label="Frise du ${day.date}"><div class="day-chart-content">${renderChart(day, state)}</div></div></div></article>`;
  }).join('');
  return `<section class="forecast-daily-rows" aria-label="Prévisions quotidiennes"><div class="daily-rows-list">${rows}</div></section>`;
}

export function piafChartMarkup(forecast, { now = Date.now(), width = 600, timezone = 'Europe/Paris', dashboard = {}, week = {}, iconMarkup = () => '', backgroundForTime = () => '#f7fafc' } = {}) {
  const end = now + 3 * HOUR;
  const samples = (forecast?.rainSteps || []).filter(sample => !sample.baseRainSource || sample.baseRainSource === 'piaf').map(sample => {
    const start = Math.max(now, sample.intervalStart), stop = Math.min(end, sample.intervalEnd);
    const amount = sample.basePrecipitation ?? sample.precipitation;
    const duration = sample.intervalEnd - sample.intervalStart;
    return { start, end: stop, amount: valid(amount) && duration > 0 ? amount * (stop - start) / duration : null,
      rate: valid(amount) && duration > 0 ? amount * HOUR / duration : null };
  }).filter(sample => valid(sample.start) && valid(sample.end) && sample.end > sample.start && valid(sample.amount))
    .sort((a, b) => a.start - b.start);
  // Classify a whole wet episode, not each five-minute amount in isolation.
  // Brief intense rain and sustained light rain must keep their quantitative curve.
  const traceEpisodes = [];
  let episode = [];
  const finishEpisode = () => {
    const amount = episode.reduce((sum, sample) => sum + sample.amount, 0);
    if (amount > 0 && amount < .1 - 1e-9 && episode.every(sample => sample.rate < 1)) {
      episode.forEach(sample => { sample.trace = rainVisible(amount); sample.insignificant = !rainVisible(amount); });
      if (rainVisible(amount)) traceEpisodes.push({ start: episode[0].start, end: episode.at(-1).end });
    }
    episode = [];
  };
  for (const sample of samples) {
    if ((episode.length && sample.start > episode.at(-1).end + 1) || sample.amount <= 0) finishEpisode();
    if (sample.amount > 0) episode.push(sample);
  }
  finishEpisode();
  const hasQuantifiedRain = samples.some(sample => sample.amount > 0 && !sample.trace && !sample.insignificant);
  const onlyTraces = traceEpisodes.length > 0 && !hasQuantifiedRain;
  width = Math.max(200, Math.round(width));
  const height = 260, left = CHART_INSET, right = width - CHART_INSET, top = 104, bottom = height;
  const maxRate = Math.max(10, ...samples.filter(sample => !sample.trace && !sample.insignificant).map(sample => sample.rate));
  const x = time => left + (time - now) / (end - now) * (right - left);
  const y = rate => rate > 0 ? bottom - 5 - rate / maxRate * 85 : bottom;
  const format = new Intl.DateTimeFormat('fr-FR', { timeZone: timezone, hour: '2-digit', minute: '2-digit' });
  const sources = forecastSources(dashboard, week);
  const precipitationIntervals = nativeRainIntervals(sources);
  const snowIntervals = dailyRainBars({ rainIntervals: precipitationIntervals, start: now, end }, now, end, 'snowfall');
  const weatherAt = time => {
    const sample = { time: new Date(time).toISOString(), stamp: time, sources: {}, temperature: null, cloudCover: null, stormSignal: false };
    for (const key of ['temperature', 'cloudCover']) {
      for (const hours of sources) {
        const value = continuous(hours, time, key);
        if (!valid(value)) continue;
        sample[key] = value;
        sample.sources[key] = hours[0].source;
        break;
      }
    }
    for (const hours of sources) {
      const value = stormAt(hours, Math.floor(time / HOUR) * HOUR);
      if (!valid(value)) continue;
      sample.stormSignal = value === 1;
      if (sample.stormSignal) sample.sources.storm = hours[0].source;
      break;
    }
    const rain = samples.find(item => item.start <= Math.min(time, end - 1) && item.end > Math.min(time, end - 1));
    sample.rain = rain?.insignificant ? 0 : rain?.rate ?? null;
    const phaseInterval = precipitationIntervals.find(item => item.start <= Math.min(time, end - 1) && item.end > Math.min(time, end - 1));
    if (!rain) {
      sample.phase = 'unknown';
      sample.phaseDescription = 'Précipitations PIAF indisponibles à cette heure ; ce pictogramme ne signifie pas un temps sec';
    } else if (phaseInterval) {
      const dry = sample.rain === 0;
      Object.assign(sample, { phase: dry ? 'dry' : phaseInterval.phase,
        snowfall: dry ? 0 : valid(phaseInterval.snowfall) ? phaseInterval.snowfall * HOUR / (phaseInterval.end - phaseInterval.start) : null,
        liquidRain: dry ? 0 : phaseInterval.liquidRain });
      if (phaseInterval.phase && !dry) sample.sources.phase = phaseInterval.source;
    }
    return sample;
  };
  const weather = Array.from({ length: 37 }, (_, index) => weatherAt(now + index * 5 * 60000));
  const edgeTime = left / (right - left) * (end - now);
  const curveWeather = [weatherAt(now - edgeTime), ...weather, weatherAt(end + edgeTime)];
  const temperatureDomain = extent(curveWeather, 'temperature', [0, 20]);
  const temperaturePadding = Math.max(1.5, (temperatureDomain[1] - temperatureDomain[0]) * .2);
  const temperatureY = value => bottom - 24 - (value - temperatureDomain[0] + temperaturePadding)
    / (temperatureDomain[1] - temperatureDomain[0] + 2 * temperaturePadding) * (bottom - 24 - top);
  let temperatureLine = '', previousTemperature = null;
  for (const sample of curveWeather) {
    if (!valid(sample.temperature)) { previousTemperature = null; continue; }
    if (previousTemperature) temperatureLine += `<path class="piaf-temperature-line" d="M${x(previousTemperature.stamp)},${temperatureY(previousTemperature.temperature)} L${x(sample.stamp)},${temperatureY(sample.temperature)}"/>`;
    previousTemperature = sample;
  }
  let lines = '', areas = '', segment = [], previousEnd = null;
  const finish = () => {
    if (!segment.length) return;
    const path = segment.map((point, index) => (index ? 'L' : 'M') + point.join(',')).join(' ');
    lines += `<path d="${path}" class="piaf-intensity-line"/>`;
    areas += `<path d="M${segment[0][0]},${bottom} L${segment.map(point => point.join(',')).join(' L')} L${segment.at(-1)[0]},${bottom} Z" class="piaf-intensity-area"/>`;
    segment = [];
  };
  const points = samples.map(sample => {
    if (previousEnd !== null && sample.start > previousEnd + 1) finish();
    if (sample.trace || sample.insignificant || sample.amount <= 0) finish();
    else segment.push([x(sample.start), y(sample.rate)], [x(sample.end), y(sample.rate)]);
    previousEnd = sample.end;
    const detail = format.format(sample.start) + ' – ' + format.format(sample.end)
      + (sample.trace ? '\nPIAF : gouttes ; repère fixe hors échelle d’intensité' : '\nPIAF')
      + '\nIntensité : ' + rainDetailNumber(sample.rate) + ' mm/h\nCumul sur ce créneau : ' + rainDetailNumber(sample.amount) + ' mm';
    return `<g class="chart-point" tabindex="0" data-tooltip="${escape(detail)}" aria-label="${escape(detail)}"><rect x="${x(sample.start)}" y="${top}" width="${Math.max(1, x(sample.end) - x(sample.start))}" height="${bottom - top}" fill="transparent"/></g>`;
  }).join('');
  finish();
  let lastTraceLabelRight = -Infinity;
  const traces = traceEpisodes.map(episode => {
    const start = x(episode.start), stop = x(episode.end), center = Math.max(23, Math.min(width - 23, (start + stop) / 2));
    const showLabel = center - 22 > lastTraceLabelRight + 3;
    if (showLabel) lastTraceLabelRight = center + 22;
    return `<rect class="piaf-trace-mark" x="${start}" y="${bottom - 5}" width="${stop - start}" height="5"/>`
      + (showLabel ? `<text class="piaf-trace-label" x="${center}" y="${bottom - 11}" text-anchor="middle">gouttes</text>` : '');
  }).join('');
  const maxIntervals = Math.max(2, Math.floor((right - left) / 64));
  const step = [15, 30, 60, 90].find(minutes => 180 / minutes <= maxIntervals) || 90;
  const times = Array.from({ length: 180 / step + 1 }, (_, i) => now + i * step * 60000);
  const ticks = times.map(time => `<line x1="${x(time)}" x2="${x(time)}" y1="0" y2="${bottom}" class="day-combined-grid"/>`).join('');
  const temperaturePoints = times.map(time => {
    const sample = weatherAt(time);
    if (!valid(sample.temperature)) return '';
    const detail = format.format(time) + '\nTempérature : ' + number(sample.temperature) + ' °C\n' + sample.sources.temperature;
    return `<g class="chart-point piaf-temperature-point" tabindex="0" data-tooltip="${escape(detail)}" aria-label="${escape(detail)}"><circle cx="${x(time)}" cy="${temperatureY(sample.temperature)}" r="3"/><text x="${x(time)}" y="${temperatureY(sample.temperature) - 10}" text-anchor="middle">${number(sample.temperature)}°</text></g>`;
  }).join('');
  const header = times.map(time => `<div class="day-timeline-slot" style="left:${x(time) / width * 100}%"><time datetime="${new Date(time).toISOString()}">${format.format(time)}</time>${weatherPictogram(weatherAt(time), iconMarkup)}</div>`).join('');
  const axis = [0, maxRate / 2, maxRate].map(rate => `<text x="${left - 6}" y="${Math.min(height - 4, y(rate) + 4)}" text-anchor="end">${number(rate)}</text>`).join('');
  const total = samples.reduce((sum, sample) => sum + sample.amount, 0);
  const snowTotal = snowIntervals.reduce((sum, interval) => sum + interval.rain, 0);
  const snowSources = [...new Set(snowIntervals.filter(interval => interval.rain > 0).map(interval => interval.source))];
  const snowPartial = snowIntervals.reduce((sum, interval) => sum + interval.end - interval.start, 0) < end - now - 1;
  const rainStatus = (onlyTraces && rainTrace(total) ? '<span class="piaf-chart-total">gouttes</span>'
    : rainVisible(total) ? `<span class="piaf-chart-total">${rainNumber(total)} mm</span>` : '')
    + (snowTotal > 0 ? `<span class="piaf-chart-total" title="Neige fraîche estimée par ${escape(snowSources.join(' · '))}, distincte du cumul PIAF en équivalent eau ; pas une hauteur au sol${snowIntervals.some(interval => interval.estimated) ? ' ; créneaux coupés estimés au prorata' : ''}">Neige ${escape(snowSources.join(' · '))} ${escape(snowLabel(snowTotal))}${snowPartial ? ' (partiel)' : ''}</span>` : '');
  const usedSources = [...new Set(weather.flatMap(sample => Object.values(sample.sources)))];
  for (const source of snowSources) if (!usedSources.includes(source)) usedSources.push(source);
  if (samples.length) usedSources.push('PIAF');
  const metadata = { AROME: dashboard.arome, ARPEGE: week, 'Open-Meteo': dashboard.openMeteo, PIAF: dashboard.piaf };
  const sourceLine = sourceUpdatesMarkup(usedSources.map(name => ({ name, fetchedAt: metadata[name]?.fetchedAt })), timezone, now);
  const rainLegend = !samples.length ? 'Précip. PIAF indisponibles' : onlyTraces ? 'Précip. PIAF' : 'Précip. PIAF mm/h équiv. eau';
  const lightStops = weather.map(sample => `<stop offset="${(sample.stamp - now) / (end - now) * 100}%" stop-color="${escape(backgroundForTime(sample.stamp))}"/>`).join('');
  const background = `<defs><linearGradient id="piaf-daylight" gradientUnits="userSpaceOnUse" x1="${left}" x2="${right}" y1="0" y2="0">${lightStops}</linearGradient></defs><rect width="${width}" height="${height}" fill="url(#piaf-daylight)"/>`;
  return `<section class="piaf-three-hour-view"><div class="day-chart-key"><span class="piaf-legend-temperature">Température °C</span><span class="piaf-legend-rain"${samples.length ? '' : ' aria-label="PIAF indisponible" aria-disabled="true" title="PIAF indisponible"'}>${rainLegend}</span>${rainStatus}<span class="day-key-spacer" aria-hidden="true"></span>${sourceLine}</div><div class="day-combined-canvas piaf-timeline-canvas" style="height:${height}px"><svg class="piaf-intensity-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="group" aria-label="Frise des trois prochaines heures : température, précipitations PIAF et pictogrammes">${background}${ticks}${hasQuantifiedRain ? axis : ''}${areas}${lines}${traces}${points}${temperatureLine}${temperaturePoints}</svg><div class="day-timeline-header">${header}</div></div></section>`;
}
