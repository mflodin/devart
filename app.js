"use strict";
(function () {
  const FFT_SIZE = 32;
  const CANVAS_SIZE = 512;
  var xStepWidth = CANVAS_SIZE / FFT_SIZE;

  var playButton = document.getElementById("playButton");
  playButton.addEventListener("click", function () {
    playButton.parentElement.removeChild(playButton);

    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var audioContext = new window.AudioContext();

    var analyser = audioContext.createAnalyser();
    analyser.fftSize = FFT_SIZE;

    var globalFrequencyData = new Uint8Array(analyser.frequencyBinCount);

    var timelineCanvas = document.getElementById("timelineCanvas");
    timelineCanvas.width = CANVAS_SIZE;
    timelineCanvas.height = CANVAS_SIZE;
    timelineCanvas.style = `margin-right: -${xStepWidth}px;`;
    var timelineContext = timelineCanvas.getContext("2d");

    var timelineImageData = timelineContext.getImageData(
      0,
      0,
      timelineCanvas.width,
      timelineCanvas.height
    );

    var instantCanvas = document.getElementById("instantCanvas");
    instantCanvas.width = CANVAS_SIZE;
    instantCanvas.height = CANVAS_SIZE;
    var instantContext = instantCanvas.getContext("2d");

    function connectAudio() {
      var audio = document.getElementById("audio");

      audio.src = "sound.mp3";
      audio.play();

      var source = audioContext.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
    }

    var log;
    window.addEventListener("click", function () {
      log = true;
    });
    function renderFrame() {
      window.requestAnimationFrame(renderFrame);
      analyser.getByteFrequencyData(globalFrequencyData);

      // debugging data
      // for (let i = 0; i < globalFrequencyData.length; i++) {
      //   globalFrequencyData[i] += 1;
      // }

      if (log) {
        console.log(globalFrequencyData);
        log = false;
      }

      drawTimeline(globalFrequencyData);
      drawInstant(globalFrequencyData);
    }

    function drawTimeline(frequencyData) {
      if (!frequencyData) {
        return;
      }
      var yStepWidth = CANVAS_SIZE / frequencyData.length;
      // timelineContext.clearRect(0, 0, xStepWidth, timelineCanvas.height);

      timelineContext.putImageData(timelineImageData, xStepWidth, 0);
      timelineContext.save();
      timelineContext.translate(xStepWidth, 0);

      for (var i = 0; i < frequencyData.length; i++) {
        var intensity = frequencyData[i] / 255;
        // timelineContext.fillStyle = `rgba(255, 255, 255, ${intensity})`;
        timelineContext.fillStyle = `hsla(${
          360 - intensity * 360
        }, 100%, 50%, ${intensity})`;
        timelineContext.fillRect(0, i * yStepWidth, xStepWidth, yStepWidth);
      }

      timelineContext.restore();
      timelineImageData = timelineContext.getImageData(
        0,
        0,
        timelineCanvas.width,
        timelineCanvas.height
      );
    }

    function drawInstant(frequencyData) {
      var yStepWidth = CANVAS_SIZE / frequencyData.length;
      instantContext.clearRect(0, 0, instantCanvas.width, instantCanvas.height);

      for (var i = 0; i < frequencyData.length; i++) {
        var intensity = frequencyData[i] / 255;
        var width = intensity * instantCanvas.width;
        // instantContext.fillStyle = `rgba(255, 255, 255, ${intensity})`;
        instantContext.fillStyle = `hsla(${
          360 - intensity * 360
        }, 100%, 50%, ${intensity})`;
        instantContext.fillRect(0, i * yStepWidth, width, yStepWidth);
      }
    }

    connectAudio();
    renderFrame();
  });
})();
