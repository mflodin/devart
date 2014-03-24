'use strict';
define([
        'http://connect.soundcloud.com/sdk.js'
    ],
    function(

    ) {

        window.requestAnimFrame = (function() {
            return window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function(callback) {
                    window.setTimeout(callback, 1000 / 60);
            };
        })();

        console.log('App started');

        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        var audioContext = new window.AudioContext();
        var scalingFactor = 12;

        var analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        var frequencyData = new Uint8Array(analyser.frequencyBinCount);
        var mainCanvas = document.getElementById('mainCanvas');
        var mainContext = mainCanvas.getContext('2d');
        var spectrumCanvas = document.createElement('canvas');
        var spectrumContext = spectrumCanvas.getContext('2d');
        var lightCanvas = document.createElement('canvas');
        var lightContext = lightCanvas.getContext('2d');
        var spectrumImageData = spectrumContext.getImageData(0, 0, spectrumCanvas.width, spectrumCanvas.height);
        var lightImageData = lightContext.getImageData(0, 0, lightCanvas.width, lightCanvas.height);
        var lineWidth = 10;


        function connectAudio() {
            var audio = document.getElementById('audio');
            var attributionLink = document.getElementById('attribution');
            var client_id = "d6fde5b15e7dd0e9006ce8d25efb5bec";

            SC.initialize({
              client_id: client_id
            });


            // SC.get("/tracks/141233519", {}, function(sound) { // testtrack - more power from start
            SC.get("/tracks/17611741", {}, function(sound) { // darkside
                audio.src = sound.stream_url + '?client_id=' + client_id;
                createAttribution(sound);
            });

            var source = audioContext.createMediaElementSource(audio); // creates a sound source
            source.connect(analyser);
            analyser.connect(audioContext.destination); // connect the source to the audioContext's destination (the speakers)
        }

        function createAttribution(sound) {
            var container = document.getElementById('soundAttribution');
            var userLink = document.createElement('a');
            var by = document.createElement('span');
            var soundLink = document.createElement('a');
            userLink.innerHTML = sound.user.username;
            userLink.href = sound.user.permalink_url;
            by.innerHTML = ' by ';
            soundLink.innerHTML = sound.title;
            soundLink.href = sound.permalink_url;
            container.appendChild(soundLink);
            container.appendChild(by);
            container.appendChild(userLink);
        }

        function renderFrame() {
            window.requestAnimFrame(renderFrame);
            analyser.getByteFrequencyData(frequencyData);
            var spectrumData = getSpectrumData(frequencyData);
            drawComposite(spectrumData);
        }
        
        function onResize () {
            mainCanvas.width = window.innerWidth;
            mainCanvas.height = Math.min(mainCanvas.width / 3, 600);
            spectrumCanvas.height = lightCanvas.height = mainCanvas.height / 2;
            spectrumCanvas.width = window.innerWidth / 2;
            lightCanvas.width = window.innerWidth / 2;
            lineWidth = Math.max(Math.min(window.innerWidth/100, 10), 2); // scale between 2px and 10px depending on screen size;
            scalingFactor = 100/lineWidth;
            // drawLight();
            console.log(mainCanvas.width, mainCanvas.height,
                spectrumCanvas.width, spectrumCanvas.height,
                lightCanvas.width, lightCanvas.height);
        };
        onResize();
        window.onresize = onResize;

        function drawTriangle (spectrumData) {
            var h = mainCanvas.height;
            var w = mainCanvas.width;
            var w2 = w/2;
            // var tw = spectrumCanvas.height;
            var th = spectrumCanvas.height;
            var tw = th / (Math.sqrt(3)/2);
            var tw2 = tw/2;
            var p = 0;
            // var th = Math.sqrt(3)/2 * tw;

            mainContext.save();
            mainContext.beginPath();
            mainContext.moveTo(w2, p);
            mainContext.lineTo(w2 + tw2, th + p);
            mainContext.lineTo(w2 - tw2, th + p);
            mainContext.closePath();



            var opacity = spectrumData.totalMagnitude / spectrumData.maxMagnitude;
            mainContext.strokeStyle = 'rgba(255,255,255,'+ opacity + ')';
            // mainContext.strokeStyle = 'rgba(255,255,255,1)';
            mainContext.lineWidth = lineWidth;
            mainContext.shadowColor = '#fff';
            mainContext.shadowBlur = 40;
            mainContext.shadowOffsetX = 0;
            mainContext.shadowOffsetY = 0;
            //for (var i = spectrumData.totalMagnitude / 100; i > 0; i--) {
                mainContext.stroke();


            mainContext.moveTo(w2, p);
            mainContext.lineTo(w2 + tw2, th + p);
            mainContext.lineTo(w2 - tw2, th + p);
            mainContext.closePath();
            //};
            mainContext.restore();
        }
        
        function drawLight(spectrumData) {
            lightContext.clearRect(0,0,lightCanvas.width, lightCanvas.height);
            if(!spectrumData) {
                return;
            }
            var opacity = spectrumData.totalMagnitude / spectrumData.maxMagnitude;
            lightContext.fillStyle = 'rgba(255,255,255,'+ opacity + ')';
            lightContext.shadowColor = '#fff';
            lightContext.shadowBlur = 40;
            lightContext.shadowOffsetX = 0;
            lightContext.shadowOffsetY = 0;
            lightContext.fillRect(0, (lightCanvas.height - lineWidth) / 2, lightCanvas.width,  lineWidth);
        }

        var maxMagnitude = 255;
        function getSpectrumData(frequencyData) {
            // body...
            var colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo'];

            var totalMagnitude = 0;
            var spectrumData = [0,0,0,0,0,0];
            for (var i = 0; i < frequencyData.length; i++) {
                if (i < frequencyData.length / 32) {
                    spectrumData[0] += frequencyData[i];
                } else if (i < frequencyData.length / 16) {
                    spectrumData[1] += frequencyData[i];
                } else if (i < frequencyData.length / 8) {
                    spectrumData[2] += frequencyData[i];
                } else if (i < frequencyData.length / 4) {
                    spectrumData[3] += frequencyData[i];
                } else if (i < frequencyData.length / 2) {
                    spectrumData[4] += frequencyData[i];
                } else {
                    spectrumData[5] += frequencyData[i];
                }

                totalMagnitude += frequencyData[i];
            }

            totalMagnitude /= scalingFactor;
            maxMagnitude = Math.max(maxMagnitude, totalMagnitude);

            return {
                maxMagnitude: maxMagnitude,
                totalMagnitude: totalMagnitude,
                bins : spectrumData,
                colors : colors
            };
        }

        var xStepWidth = 2;


        function drawSpectrum(spectrumData) {
            if(!spectrumData) {
                return;
            }
            var y = 0;
            spectrumContext.clearRect(0, 0, spectrumCanvas.width,  spectrumCanvas.height);

            spectrumContext.putImageData(spectrumImageData, xStepWidth,  0); // draw last frame's data displaced by xStepWidth
            spectrumContext.save();
            spectrumContext.translate(xStepWidth,  spectrumCanvas.height / 2);
            spectrumContext.globalAlpha = spectrumData.totalMagnitude / spectrumData.maxMagnitude;
            spectrumContext.shadowBlur = 40;
            spectrumContext.shadowOffsetX = 0;
            spectrumContext.shadowOffsetY = 0;


            for (var i = 0; i < spectrumData.bins.length; i++) {
                // multiply spectrum by a zoom value
                var magnitude = spectrumData.bins[i] / scalingFactor;
                // Draw rectangle bars for each frequency bin
                spectrumContext.fillStyle = spectrumData.colors[Math.floor(i)];
                spectrumContext.shadowColor = spectrumContext.fillStyle;
                spectrumContext.fillRect(0, 0 - spectrumData.totalMagnitude / 2 + y, xStepWidth,  magnitude);
                y += magnitude;
            };


            spectrumContext.restore();
            // spectrumContext.clearRect(0, 0, xStepWidth,  spectrumCanvas.height);
            // spectrumContext.shadowBlur = null;
            // spectrumContext.shadowColor = null;

            
            spectrumImageData = spectrumContext.getImageData(0, 0, spectrumCanvas.width - xStepWidth,  spectrumCanvas.height);
            

        }

        var horizontalShear = 0.576689; // 1 + e + pi?
        var verticalShear = 1/3;
        function drawComposite(spectrumData) {
            mainContext.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

            drawLight(spectrumData);
            mainContext.save();

            // debugDraw();
            drawSpectrum(spectrumData);



            mainContext.save();
            mainContext.translate(mainCanvas.width/2, 0);
            mainContext.transform(1, verticalShear, horizontalShear, 1, 0, 0);
            // mainContext.translate(-10 * horizontalShear, 10);

            mainContext.drawImage(spectrumCanvas, -2,0);
            mainContext.restore();

            mainContext.save();
            mainContext.translate(mainCanvas.width/2, 0);
            mainContext.transform(1, -verticalShear, -horizontalShear, 1, 0, 0);
            // mainContext.translate(10 * horizontalShear, 10);
            mainContext.drawImage(lightCanvas, -lightCanvas.width,0);
            mainContext.restore();

            mainContext.translate(0,lineWidth);
            drawTriangle(spectrumData);
            mainContext.restore();
        }

        function debugDraw () {
            spectrumContext.clearRect(0,0,spectrumCanvas.width, spectrumCanvas.height);
            spectrumContext.fillStyle ='rgba(255,0,0,0.5)';
            spectrumContext.fillRect(0,0,spectrumCanvas.width,spectrumCanvas.height);
            lightContext.fillStyle ='rgba(0,255,0,0.5)';

            lightContext.fillRect(0,0,lightCanvas.width,lightCanvas.height);
            mainContext.fillStyle ='rgba(0,0,255,0.5)';
            mainContext.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
            mainContext.save();
            mainContext.translate(0,10);
            drawTriangle({totalMagnitude: 1, maxMagnitude : 1});
            mainContext.restore();
        }

        connectAudio();
        drawLight();
        renderFrame();
    });