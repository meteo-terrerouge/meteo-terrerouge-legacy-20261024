function sandboxNowcastDimensions() {
  return { width: window.matchMedia("(max-width: 600px)").matches ? 360 : 640, height: 360 };
}
function sandboxNowcastContext(label, detail) {
  return '<button type="button" class="horizon-nowcast-context" data-open-nowcast-link="true" aria-controls="nowcast-details" title="' + escapeText(detail) + '"><span>Nowcasting</span><strong>' + escapeText(label) + '</strong><small>Carte ↗</small></button>';
}
function sandboxCloudLevel(value, hasPhenomenon = false) {
  const cloud = value == null ? NaN : Number(value);
  const level = !Number.isFinite(cloud) ? (hasPhenomenon ? 5 : 3)
    : cloud <= 5 ? 0 : cloud <= 25 ? 1 : cloud <= 50 ? 2 : cloud <= 75 ? 3 : cloud <= 90 ? 4 : 5;
  return hasPhenomenon ? Math.max(1, level) : level;
}
function sandboxSkyPresentation(slot) {
  const hasPhenomenon = slot.level > 0 || Boolean(slot.storm) || Boolean(slot.hail) || Boolean(slot.modelStorm);
  const level = sandboxCloudLevel(slot.cloudCover, hasPhenomenon);
  const labels = ["dégagé", "très peu nuageux", "peu nuageux", "nuageux", "très nuageux", "couvert"];
  const suffixes = ["1", "tres-peu-nuageux", "2", "3", "4", "5"];
  const period = slot.night ? "nuit" : "jour";
  return {
    level,
    label: (slot.night ? "Nuit, ciel " : "Ciel ") + labels[level],
    src: "pictogrammes/ciel-" + period + "-" + suffixes[level] + ".svg"
  };
}
function sandboxStormPresentation(slot, now) {
  if (!slot.storm) return null;
  const observed = slot.storm.locallyObserved && slot.start <= now && now < slot.end;
  const qualifier = observed ? "en cours" : shortTermRiskQualifier(slot.storm.passage).trim();
  const intensity = slot.storm.level >= 4 ? "violent" : slot.storm.level >= 2 ? "modéré" : "faible";
  return { label: ["Orage", qualifier].filter(Boolean).join(" "), intensity, observed };
}
function sandboxSlotPresentation(slot, now) {
  const sky = sandboxSkyPresentation(slot);
  const storm = sandboxStormPresentation(slot, now);
  const rain = slot.level > 0 && slot.label !== "Grêle";
  const unavailable = slot.label === "Indisponible";
  const qualifier = slot.label === "Gouttes" ? slot.qualifier.replace(/^(possible|probable)$/, "$1s") : slot.qualifier;
  let title = unavailable ? "Indisponible" : rain ? slot.label : storm ? "Orage" : slot.hail ? "Grêle" : slot.modelStorm ? "Orage possible" : sky.label.replace(/^Nuit, ciel |^Ciel /, "Ciel ");
  const details = [];
  if (rain && qualifier) details.push(qualifier);
  if (storm) details.push(storm.label + (storm.intensity ? " · " + storm.intensity : ""));
  if (slot.modelStorm && title !== "Orage possible") details.push("Orage possible");
  if (slot.hail) {
    const hailQualifier = slot.hailLocalized == null ? shortTermRiskQualifier(slot.hailRisk).trim() : "possible";
    if (title !== "Grêle") details.push(["Grêle", hailQualifier].filter(Boolean).join(" "));
    else if (hailQualifier) details.push(hailQualifier);
    if (Number.isFinite(Number(slot.hailRisk))) details.push("passage cellule " + Math.round(slot.hailRisk) + " %");
  }
  if (slot.hail && storm && !rain) title = "Orage · grêle";
  const wind = slot.wind >= 2;
  return {
    sky, storm, rain, unavailable, title, details,
    signature: JSON.stringify([sky.level, slot.night, slot.level, title, details, Boolean(slot.hail), wind ? slot.wind : 0, Boolean(slot.modelStorm)])
  };
}
function sandboxWeatherGroups(slots, now) {
  const groups = [];
  slots.forEach((slot, index) => {
    const presentation = sandboxSlotPresentation(slot, now);
    const previous = groups.at(-1);
    if (previous?.presentation.signature === presentation.signature && previous.slot.end === slot.start) {
      previous.endIndex = index + 1;
      previous.slot.end = slot.end;
      previous.slot.total += slot.total;
      previous.slot.windSpeed = Math.max(previous.slot.windSpeed || 0, slot.windSpeed || 0);
      previous.slot.windGust = Math.max(previous.slot.windGust || 0, slot.windGust || 0);
      if (Number.isFinite(previous.slot.hailRisk) || Number.isFinite(slot.hailRisk)) {
        previous.slot.hailRisk = Math.max(Number(previous.slot.hailRisk) || 0, Number(slot.hailRisk) || 0);
      }
      if (Number.isFinite(previous.slot.hailScore) || Number.isFinite(slot.hailScore)) {
        previous.slot.hailScore = Math.max(Number(previous.slot.hailScore) || 0, Number(slot.hailScore) || 0);
      }
    } else groups.push({ presentation, startIndex: index, endIndex: index + 1, slot: { ...slot } });
  });
  return groups;
}
function sandboxStartNearHour(start, end) {
  const nextHour = (Math.floor(start / 3600000) + 1) * 3600000;
  return nextHour - start < 30 * 60000 && nextHour <= end;
}
function sandboxQuietBoundary(boundary, start, end) {
  const hideStart = sandboxStartNearHour(start, end);
  if (boundary === start) return !hideStart;
  return boundary === end || (boundary % 3600000 === 0
    && (hideStart || boundary - start >= 30 * 60000) && end - boundary >= 30 * 60000);
}
function sandboxThreeHourAxis(slots, time) {
  const start = slots[0].start, end = slots.at(-1).end;
  const position = value => (value - start) / (end - start) * 100;
  const ticks = [start, ...slots.map(slot => slot.end)].filter(boundary => boundary % 900000 === 0).map(boundary =>
    '<span class="horizon-minute' + (sandboxQuietBoundary(boundary, start, end) ? '' : ' quiet-minor') + (boundary === start && sandboxStartNearHour(start, end) ? ' near-hour-start' : '') + '" style="left:' + position(boundary) + '%" aria-label="' + time(boundary) + '" title="' + time(boundary) + '">' + time(boundary) + '</span>');
  return '<div class="horizon-axis">' + ticks.join('') + '</div>';
}
function sandboxThreeHourTimeline(preparedSlots, now, ongoingStorm = null) {
  const probabilityStep = value => value <= 0 ? 0 : value < 20 ? 1 : value < 40 ? 2 : value < 60 ? 3 : value < 80 ? 4 : 5;
  const slots = (preparedSlots || []).filter(slot => slot.end > now).map(slot => ({ ...slot }));
  if (!slots.length) return '<p class="horizon-empty">Prévision indisponible</p>';
  const time = value => hourFormat.format(new Date(value));
  const windIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 7h12c6 0 6-6 1-6M2 12h17c5 0 5 7 0 7M2 17h7c5 0 5 6 1 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const clock = value => {
    const [hour, minute] = time(value).split(":");
    return Number(hour) + " h" + (minute === "00" ? "" : " " + minute);
  };
  const groups = sandboxWeatherGroups(slots, now);
  const quiet = groups.length === 1 && !groups[0].presentation.rain && !groups[0].presentation.storm && !groups[0].slot.hail && !groups[0].slot.modelStorm && !(groups[0].slot.wind >= 2);
  const compact = groups.every(group => !group.presentation.rain && !group.presentation.storm && !group.slot.hail && !group.slot.modelStorm
    && !(group.slot.wind >= 2) && group.presentation.details.length === 0);
  const renderIcon = (slot, presentation) => {
    const layers = [presentation.sky.src];
    if (slot.level > 0) layers.push("pictogrammes/calque-pluie-" + Math.max(1, Math.min(5, slot.level)) + ".svg");
    if (slot.wind >= 2) layers.push("pictogrammes/calque-vent.svg");
    if (slot.storm || slot.modelStorm) layers.push("pictogrammes/calque-orage.svg");
    if (slot.hail) layers.push("pictogrammes/calque-grele.svg");
    const alt = [presentation.sky.label, presentation.title, ...presentation.details, slot.wind >= 2 ? shortTermWindLabel(slot.wind) : ""].filter(Boolean).join(" · ");
    return '<span class="horizon-period-icon" role="img" aria-label="' + escapeText(alt) + '">' + layers.map(src => '<img src="' + src + '" alt="" loading="lazy" decoding="async">').join("") + '</span>';
  };
  const renderGroup = ({ slot, presentation, startIndex, endIndex }) => {
    const duration = slot.end - slot.start;
    const periodLabel = endIndex - startIndex > 1 || duration !== 15 * 60000 ? clock(slot.start) + " – " + clock(slot.end) : clock(slot.start);
    const stormTone = slot.storm ? stormRiskIntensityStep(presentation.storm?.observed ? 5 : probabilityStep(slot.storm.passage), slot.storm.level) : 0;
    const hailTone = slot.hail ? probabilityStep(slot.hailRisk) : 0;
    const tone = Math.max(slot.level || 0, slot.wind || 0, stormTone, hailTone);
    const rainTone = Math.max(0, Math.min(5, slot.level || 0));
    const possible = /possible/.test(slot.qualifier || "") || /possible/.test(presentation.storm?.label || "") || Boolean(slot.modelStorm) || slot.hail && slot.hailLocalized !== true;
    const clear = !presentation.rain && !presentation.storm && !slot.hail && !slot.modelStorm && !(slot.wind >= 2) && presentation.sky.level === 0;
    const detailed = presentation.details.length > 0 || slot.wind >= 2;
    const description = periodLabel + " : " + [presentation.title, ...presentation.details].filter(Boolean).join(" · ")
      + (slot.hailLocalized === false ? " · noyau de grêle non localisé dans les données" : "")
      + (slot.hail && slot.hailScore != null ? " · indice polarimétrique de la zone " + Math.round(slot.hailScore) + " % (indice non probabiliste)" : "");
    const mainTag = presentation.rain ? "button" : "div";
    const mainAction = presentation.rain ? ' type="button" data-summary-target="rain"' : '';
    const windMaximum = Math.round(Math.max(slot.windGust || 0, slot.windSpeed || 0));
    const windLabel = windMaximum > 0 ? "max " + windMaximum + " km/h" : shortTermWindLabel(slot.wind);
    const windMarkup = slot.wind >= 2 ? '<button type="button" class="horizon-period-wind" data-summary-target="wind48" aria-label="' + escapeText(shortTermWindLabel(slot.wind) + (windMaximum ? " · " + windLabel : "")) + '">' + windIcon + '<span>' + escapeText(windLabel) + '</span></button>' : '<span class="horizon-period-wind-spacer" aria-hidden="true"></span>';
    return '<article class="horizon-period tone-' + tone + ' rain-' + rainTone + (slot.night ? ' is-night' : '') + (clear ? ' is-clear' : '') + (possible ? ' is-possible' : '') + (slot.hail ? ' is-hail' : '') + (slot.label === 'Gouttes' ? ' is-drizzle' : '') + (detailed ? ' is-detailed' : '') + (presentation.unavailable ? ' is-unavailable' : '') + '" style="--period-duration:' + duration + '" aria-label="' + escapeText(description) + '">'
      + '<time datetime="' + new Date(slot.start).toISOString() + '">' + escapeText(periodLabel) + '</time>'
      + '<' + mainTag + mainAction + ' class="horizon-period-main" title="' + escapeText(description) + '">' + renderIcon(slot, presentation) + '<strong>' + escapeText(presentation.title) + '</strong><span class="horizon-period-details">' + presentation.details.map(detail => '<span>' + escapeText(detail) + '</span>').join('') + '</span></' + mainTag + '>'
      + windMarkup + '</article>';
  };
  return '<section class="horizon-scroll' + (quiet ? ' is-quiet' : '') + (compact ? ' is-compact' : '') + '" aria-label="Prévisions météo regroupées des trois prochaines heures"><div class="horizon-timeline">'
    + groups.map(renderGroup).join('') + '</div></section>';
}

function sandboxToggleRainDetails() {
  const rain = $("rain-details");
  const open = rain.hidden;
  rain.hidden = !open;
  document.querySelectorAll('.horizon-scroll [data-summary-target="rain"]').forEach(button => {
    button.setAttribute("aria-controls", "rain-details");
    button.setAttribute("aria-expanded", String(open));
  });
}
function sandboxSyncRainDetails(intervals) {
  const slots = intervals.map((interval, index) => ({start: index === 0 ? Math.floor(interval.start / 900000) * 900000 : interval.start, end: interval.end}));
  if (!slots.length) return;
  $("rain-bars").style.gridTemplateColumns = slots.map(slot => (slot.end - slot.start) + 'fr').join(' ');
  $("rain-axis").style.gridTemplateColumns = '';
  $("rain-axis").innerHTML = sandboxThreeHourAxis(slots, value => hourFormat.format(new Date(value)));
  sandboxBindRainScroll();
}
function sandboxBindRainScroll() {
  const scrolls = [...document.querySelectorAll('.horizon-scroll, .horizon-detail-scroll')];
  scrolls.forEach(scroller => {
    if (scroller.dataset.syncBound) return;
    scroller.dataset.syncBound = 'true';
    scroller.addEventListener('scroll', () => document.querySelectorAll('.horizon-scroll, .horizon-detail-scroll').forEach(other => {
      if (other !== scroller && other.scrollLeft !== scroller.scrollLeft) other.scrollLeft = scroller.scrollLeft;
    }), {passive:true});
  });
}

