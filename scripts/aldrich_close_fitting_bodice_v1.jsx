/* eslint-disable @typescript-eslint/no-unused-vars */
/*
 * Aldrich Close Fitting Bodice v1 (reference source)
 * This file is stored as a read-only drafting source for the web port.
 * Internal measurements are in centimeters.
 */

(function () {
  var defaultMeasurements = {
    bust: 88,
    waist: 68,
    hip: 94,
    bustEase: 5,
    waistEase: 3,
    napeToWaist: 41,
    shoulder: 12.25,
    backWidth: 34.4,
    waistToHip: 20.6,
    armscyeDepth: 21,
    chest: 32.4,
    neckSize: 37,
    closeWaistShaping: true,
    reducedDarting: false,
  };

  function round2(value) {
    return Math.round(value * 100) / 100;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function computeFrontNeckDart(neckSize, reducedDarting) {
    var base = neckSize * 0.04 + 0.8;
    var adjusted = reducedDarting ? base * 0.75 : base;
    return round2(clamp(adjusted, 0.8, 4));
  }

  function computeWaistDiff(bust, bustEase, waist, waistEase) {
    return round2(Math.max(0, bust + bustEase - (waist + waistEase)));
  }

  function computeWaistDartsFromDiff(bustWaistDiff, closeWaistShaping, reducedDarting) {
    var shapingFactor = closeWaistShaping ? 1 : 0.68;
    var dartFactor = reducedDarting ? 0.78 : 1;
    var activeDiff = Math.max(0, bustWaistDiff * shapingFactor * dartFactor);

    var frontWaistDart = activeDiff * 0.26;
    var backWaistDart = activeDiff * 0.24;
    var frontSideWaistDart = activeDiff * 0.27;
    var backSideWaistDart = Math.max(
      0,
      activeDiff - frontWaistDart - backWaistDart - frontSideWaistDart
    );

    return {
      frontWaistDart: round2(frontWaistDart),
      backWaistDart: round2(backWaistDart),
      frontSideWaistDart: round2(frontSideWaistDart),
      backSideWaistDart: round2(backSideWaistDart),
      frontWaistDartBackOff: round2(frontWaistDart * 0.35),
    };
  }

  function computePointADistance(m) {
    return round2(m.backWidth / 2 + 1.5);
  }

  function computePointBDistance(m) {
    return round2(m.chest / 2 + 2.4);
  }

  function computeDerived(m) {
    var frontNeckDart = computeFrontNeckDart(m.neckSize, m.reducedDarting);
    var bustWaistDiff = computeWaistDiff(m.bust, m.bustEase, m.waist, m.waistEase);
    var darts = computeWaistDartsFromDiff(
      bustWaistDiff,
      m.closeWaistShaping,
      m.reducedDarting
    );

    return {
      frontNeckDart: frontNeckDart,
      bustWaistDiff: bustWaistDiff,
      frontWaistDart: darts.frontWaistDart,
      backWaistDart: darts.backWaistDart,
      frontSideWaistDart: darts.frontSideWaistDart,
      backSideWaistDart: darts.backSideWaistDart,
      frontWaistDartBackOff: darts.frontWaistDartBackOff,
    };
  }

  // Illustrator-specific drawing helpers kept as placeholders for parity.
  function drawLine() {}
  function drawCurve() {}
  function createMarker() {}
  function createLineLabel() {}

  function run() {
    var m = defaultMeasurements;
    var d = computeDerived(m);

    // Front/back block distances.
    var backWidth = computePointADistance(m);
    var frontWidth = computePointBDistance(m);

    // Drafting logic intentionally mirrors the web engine.
    // In the web app, these are exported as SVG paths/points.
    $.writeln("Aldrich bodice ready. backWidth=" + backWidth + " frontWidth=" + frontWidth);
    $.writeln("Derived: " + d.frontNeckDart + ", " + d.bustWaistDiff);
  }

  run();
})();
