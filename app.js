"use strict";
(function () {
  var playButton = document.getElementById("playButton");
  playButton.addEventListener("click", function () {
    playButton.parentElement.removeChild(playButton);

    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var audioContext = new window.AudioContext();

    var analyser = audioContext.createAnalyser();
    analyser.fftSize = 32;

    var globalFrequencyData = new Uint8Array(analyser.frequencyBinCount);

    var timelineCanvas = document.getElementById("timelineCanvas");
    timelineCanvas.width = 512;
    timelineCanvas.height = 512;
    var timelineContext = timelineCanvas.getContext("2d");

    var timelineImageData = timelineContext.getImageData(
      0,
      0,
      timelineCanvas.width,
      timelineCanvas.height
    );

    var instantCanvas = document.getElementById("instantCanvas");
    instantCanvas.width = 512;
    instantCanvas.height = 512;
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

      // for (let i = 0; i < frequencyData.length; i++) {
      //   frequencyData[i] += 1;
      // }

      if (log) {
        console.log(globalFrequencyData);
        log = false;
      }

      drawTimeline(globalFrequencyData);
      drawInstant(globalFrequencyData);
    }

    var xStepWidth = 1;
    function drawTimeline(frequencyData) {
      if (!frequencyData) {
        return;
      }
      var yStepWidth = 512 / frequencyData.length;
      // timelineContext.clearRect(0, 0, xStepWidth, timelineCanvas.height);

      timelineContext.putImageData(timelineImageData, xStepWidth, 0);
      timelineContext.save();
      timelineContext.translate(xStepWidth, 0);

      for (var i = 0; i < frequencyData.length; i++) {
        var intensity = frequencyData[i] / 255;
        timelineContext.fillStyle = `rgba(255, 255, 255, ${intensity})`;
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
      var yStepWidth = 512 / frequencyData.length;
      instantContext.clearRect(0, 0, instantCanvas.width, instantCanvas.height);

      for (var i = 0; i < frequencyData.length; i++) {
        var intensity = frequencyData[i] / 255;
        var width = intensity * instantCanvas.width;
        instantContext.fillStyle = `rgba(255, 255, 255, ${intensity})`;
        instantContext.fillRect(0, i * yStepWidth, width, yStepWidth);
      }
    }

    connectAudio();
    renderFrame();
  });
})();
