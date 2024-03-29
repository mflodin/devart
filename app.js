"use strict";
(function () {
  var playButton = document.getElementById("playButton");
  playButton.addEventListener("click", function () {
    playButton.parentElement.removeChild(playButton);
    console.log("App started");

    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var audioContext = new window.AudioContext();
    var scalingFactor = 12;

    var analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    // analyser.smoothingTimeConstant = 0.95;
    var frequencyData = new Uint8Array(analyser.frequencyBinCount);
    var mainCanvas = document.getElementById("mainCanvas");
    var mainContext = mainCanvas.getContext("2d");
    var spectrumCanvas = document.createElement("canvas");
    var spectrumContext = spectrumCanvas.getContext("2d");
    var lightCanvas = document.createElement("canvas");
    var lightContext = lightCanvas.getContext("2d");
    var spectrumImageData = spectrumContext.getImageData(
      0,
      0,
      spectrumCanvas.width,
      spectrumCanvas.height
    );
    var lineWidth = 10;
    var lightPosition = 0.45;
    var mainTriangle;
    var innerTriangleGradient;
    var sqrt3 = Math.sqrt(3);
    var sqrt3reciprocal = 1 / sqrt3;

    function connectAudio() {
      var audio = document.getElementById("audio");

      audio.src = "sound.mp3";
      audio.play();

      var source = audioContext.createMediaElementSource(audio); // creates a sound source
      source.connect(analyser);
      analyser.connect(audioContext.destination); // connect the source to the audioContext's destination (the speakers)
    }

    var log;
    window.addEventListener("click", function () {
      log = true;
    });
    function renderFrame() {
      window.requestAnimationFrame(renderFrame);
      analyser.getByteFrequencyData(frequencyData);
      if (log) {
        console.log(frequencyData);
        log = false;
      }
      var spectrumData = getSpectrumData(frequencyData);
      drawComposite(spectrumData);
    }

    function onResize() {
      mainCanvas.width = window.innerWidth;
      mainCanvas.height = Math.min(mainCanvas.width / 3, 600);
      spectrumCanvas.height = lightCanvas.height = mainCanvas.height / 2;
      spectrumCanvas.width = window.innerWidth / 2;
      lightCanvas.width = window.innerWidth / 2;
      lineWidth = Math.max(Math.min(window.innerWidth / 100, 10), 2); // scale between 2px and 10px depending on screen size;
      mainTriangle = getMainTriangle(
        { x: mainCanvas.width * 0.5, y: 0 },
        spectrumCanvas.height
      );
    }
    onResize();
    window.onresize = onResize;

    function drawInnerTriangle(mainTriangle, spectrumData) {
      var innerTriangle = getInnerTriangle(
        mainTriangle,
        spectrumData.intensity
      );

      mainContext.save();
      // mainContext.globalCompositeOperation = 'copy';
      var midPointFarSide = getPointOnLine(
        innerTriangle.c,
        innerTriangle.b,
        0.25
      );
      // mainContext.strokeStyle = 'rgba(255,255,255,'+ spectrumData.intensity + ')';
      innerTriangleGradient = mainContext.createLinearGradient(
        innerTriangle.a.x,
        innerTriangle.a.y,
        midPointFarSide.x,
        midPointFarSide.y
      );
      // innerTriangleGradient = mainContext.createLinearGradient(innerTriangle.a.x, innerTriangle.a.y, (innerTriangle.b.x - innerTriangle.c.x) * 0.5 + innerTriangle.a.x,  innerTriangle.a.y);
      innerTriangleGradient.addColorStop(
        0,
        "rgba(255,255,255," + spectrumData.intensity + ")"
      );
      innerTriangleGradient.addColorStop(
        0.5 + 0.5 * spectrumData.intensity,
        "rgba(255,255,255,0)"
      );
      mainContext.fillStyle = innerTriangleGradient; //'rgba(255,255,255,1)';
      mainContext.shadowColor = "#fff";
      mainContext.shadowBlur = 40;
      mainContext.shadowOffsetX = 0;
      mainContext.shadowOffsetY = 0;
      mainContext.beginPath();

      mainContext.moveTo(
        innerTriangle.a.x + lineWidth * sqrt3reciprocal,
        innerTriangle.a.y - lineWidth * sqrt3reciprocal
      );
      mainContext.lineTo(
        innerTriangle.a.x,
        innerTriangle.a.y + lineWidth * sqrt3reciprocal
      );
      mainContext.lineTo(innerTriangle.b.x, innerTriangle.b.y);
      mainContext.lineTo(innerTriangle.c.x, innerTriangle.c.y);
      mainContext.closePath();
      mainContext.fill();
      mainContext.restore();
    }

    function getPointOnLine(startPoint, endPoint, fraction) {
      return {
        x: (endPoint.x - startPoint.x) * fraction + startPoint.x,
        y: (endPoint.y - startPoint.y) * fraction + startPoint.y,
      };
    }

    function getInnerTriangle(outerTriangle, spread) {
      var a = getPointOnLine(outerTriangle.a, outerTriangle.c, lightPosition);
      var b = getPointOnLine(
        outerTriangle.a,
        outerTriangle.b,
        0.5 + spread * 0.5
      );
      var c = getPointOnLine(
        outerTriangle.b,
        outerTriangle.a,
        0.5 + spread * 0.5
      );

      return { a: a, b: b, c: c };
    }

    function getMainTriangle(startPoint, height) {
      var halfWidth = height / Math.sqrt(3); // the height / side relation of a unilateral triangle
      var a = { x: startPoint.x, y: startPoint.y };
      var b = { x: startPoint.x + halfWidth, y: height + startPoint.y };
      var c = { x: startPoint.x - halfWidth, y: height + startPoint.y };

      return { a: a, b: b, c: c };
    }

    function drawTriangle(spectrumData) {
      var opacity = spectrumData.intensity;

      mainContext.save();
      mainContext.strokeStyle = mainContext.shadowColor =
        "hsl(0,0%," + (20 + 80 * opacity) + "%)";
      mainContext.shadowBlur = 40;
      mainContext.shadowOffsetX = 0;
      mainContext.shadowOffsetY = 0;
      mainContext.lineWidth = lineWidth;
      mainContext.beginPath();
      mainContext.moveTo(mainTriangle.a.x, mainTriangle.a.y);
      mainContext.lineTo(mainTriangle.b.x, mainTriangle.b.y);
      mainContext.lineTo(mainTriangle.c.x, mainTriangle.c.y);
      // mainContext.lineJoin = 'round';
      mainContext.closePath();
      mainContext.stroke();

      mainContext.restore();
    }

    function drawLight(spectrumData) {
      lightContext.globalCompositeOperation = "copy";
      if (!spectrumData) {
        return;
      }
      var opacity = spectrumData.intensity;
      lightContext.fillStyle = lightContext.shadowColor =
        "hsl(0,0%," + 100 * opacity + "%)";
      lightContext.shadowColor = lightContext.fillStyle;
      lightContext.shadowBlur = 40;
      lightContext.shadowOffsetX = 0;
      lightContext.shadowOffsetY = 0;
      lightContext.fillRect(
        0,
        (lightCanvas.height - lineWidth * 0.5) * lightPosition,
        lightCanvas.width,
        lineWidth
      );
    }

    var maxMagnitude = spectrumCanvas.height * scalingFactor;
    function getSpectrumData(frequencyData) {
      // body...
      var colors = ["red", "orange", "yellow", "green", "blue", "indigo"];

      var totalMagnitude = 0;
      var bins = [0, 0, 0, 0, 0, 0];
      for (var i = 0; i < frequencyData.length; i++) {
        if (i < frequencyData.length / 32) {
          bins[0] += frequencyData[i];
        } else if (i < frequencyData.length / 16) {
          bins[1] += frequencyData[i];
        } else if (i < frequencyData.length / 8) {
          bins[2] += frequencyData[i];
        } else if (i < frequencyData.length / 4) {
          bins[3] += frequencyData[i];
        } else if (i < frequencyData.length / 2) {
          bins[4] += frequencyData[i];
        } else {
          bins[5] += frequencyData[i];
        }

        totalMagnitude += frequencyData[i];
      }

      maxMagnitude = Math.max(maxMagnitude, totalMagnitude);
      scalingFactor = maxMagnitude / spectrumCanvas.height;

      return {
        maxMagnitude: maxMagnitude,
        totalMagnitude: totalMagnitude,
        intensity: totalMagnitude / maxMagnitude,
        bins: bins,
        colors: colors,
      };
    }

    var xStepWidth = 2;
    function drawSpectrum(spectrumData) {
      if (!spectrumData) {
        return;
      }
      var y = 0;
      spectrumContext.clearRect(0, 0, xStepWidth, spectrumCanvas.height);

      spectrumContext.putImageData(spectrumImageData, xStepWidth, 0); // draw last frame's data displaced by xStepWidth
      spectrumContext.save();
      spectrumContext.translate(xStepWidth, spectrumCanvas.height / 2);
      spectrumContext.globalAlpha = spectrumData.intensity;
      spectrumContext.shadowBlur = 40;
      spectrumContext.shadowOffsetX = 0;
      spectrumContext.shadowOffsetY = 0;

      for (var i = 0; i < spectrumData.bins.length; i++) {
        // multiply spectrum by a zoom value
        // var scaledMagnitude = scalingFactor;
        var scaledMagnitude = spectrumData.bins[i] / scalingFactor;
        // Draw rectangle bars for each frequency bin
        spectrumContext.fillStyle = spectrumData.colors[Math.floor(i)];
        spectrumContext.shadowColor = spectrumContext.fillStyle;
        spectrumContext.fillRect(
          0,
          y - spectrumData.totalMagnitude / (2 * scalingFactor),
          //   y / (2 * scalingFactor),
          xStepWidth,
          scaledMagnitude
        );
        y += scaledMagnitude;
      }

      spectrumContext.restore();
      spectrumImageData = spectrumContext.getImageData(
        0,
        0,
        spectrumCanvas.width - xStepWidth,
        spectrumCanvas.height
      );
    }

    var horizontalShear = 0.576689; // 1 + e + pi?
    var verticalShear = 0.25;
    function drawComposite(spectrumData) {
      mainContext.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

      drawLight(spectrumData);
      mainContext.save();

      // debugDraw();
      drawSpectrum(spectrumData);

      mainContext.save();
      mainContext.translate(mainCanvas.width / 2, 0);
      mainContext.transform(1, verticalShear, horizontalShear, 1, 0, 0);
      mainContext.translate(-lineWidth * horizontalShear - 2, lineWidth * 2); // ok to be higher

      mainContext.drawImage(spectrumCanvas, -2, 0);
      mainContext.restore();

      mainContext.save();
      mainContext.translate(mainCanvas.width / 2, 0);
      mainContext.transform(1, -verticalShear, -horizontalShear, 1, 0, 0);
      mainContext.translate(lineWidth * horizontalShear + 2, lineWidth * 2);
      mainContext.drawImage(lightCanvas, -lightCanvas.width, 0);
      mainContext.restore();

      mainContext.translate(0, lineWidth * 2);
      drawInnerTriangle(mainTriangle, spectrumData);
      drawTriangle(spectrumData);
      mainContext.restore();
    }

    function debugDraw() {
      mainContext.save();
      mainContext.translate(0, lineWidth * 2);
      drawLight({ intensity: 0.5 });
      drawTriangle({ intensity: 0.5 });
      drawInnerTriangle(mainTriangle, { intensity: 0.5 });
      mainContext.restore();
      spectrumContext.clearRect(
        0,
        0,
        spectrumCanvas.width,
        spectrumCanvas.height
      );
      spectrumContext.fillStyle = "rgba(255,0,0,0.5)";
      spectrumContext.fillRect(
        0,
        0,
        spectrumCanvas.width,
        spectrumCanvas.height
      );
      lightContext.fillStyle = "rgba(0,255,0,0.5)";

      lightContext.fillRect(0, 0, lightCanvas.width, lightCanvas.height);
      mainContext.fillStyle = "rgba(0,0,255,0.5)";
      // mainContext.fillStyle = innerTriangleGradient;
      mainContext.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
    }

    connectAudio();
    // drawComposite({intensity: 0.5, bins: []});
    renderFrame();
    // debugDraw();
  });
})();
