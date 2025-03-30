// ==UserScript==
// @name         QuickEdge 1.3 by RHW
// @namespace    https://github.com/tf7software/QuickEdge
// @version      1.3
// @description  Skip Audio/Video on Edgenuity
// @author       RHW (https://rhw.one)
// @match        *://*.edgenuity.com/*
// @match        *://*.apexvs.com/*
// @match        *://*.apexlearning.com/*
// @match        *://*.brainly.com/*
// @match        *://*.brainly.in/*
// @match        *://*.brainly.ro/*
// @match        *://*.brainly.pl/*
// @match        *://*.brainly.ph/*
// @match        *://*.il-apps.com/*
// @match        *://*.learnosity.com/*
// @updateURL    https://cdn.jsdelivr.net/gh/tf7software/QuickEdge@raw/refs/heads/main/quickedge.client.js
// @downloadURL  https://cdn.jsdelivr.net/gh/tf7software/QuickEdge@raw/refs/heads/main/quickedge.client.js
// @grant        none
// ==/UserScript==

// This was NOT written by AI. I had ChatGPT add comments if people wanna edit it tho.

(function() {
    'use strict';

    // Trick Edgenuity into thinking the video has been fully watched by overriding the played property.
    Object.defineProperty(HTMLMediaElement.prototype, 'played', {
        get: function() {
            return {
                length: 1,
                start: function(index) { return 0; },
                end: function(index) { return this.duration; }
            };
        },
        configurable: true
    });

    let video;            // reference to the video element
    let allowedTime = 0;  // the furthest time the user is allowed to seek to
    let autoSkipAudio = false; // flag for auto skipping non-video audio

    // Create an overlay control panel with speed and skip/rewind buttons.
    function createControlPanel() {
        const controlPanel = document.createElement('div');
        controlPanel.style.position = 'fixed';
        controlPanel.style.top = '10px';
        controlPanel.style.right = '10px';
        controlPanel.style.background = 'rgba(0, 0, 0, 0.6)';
        controlPanel.style.color = 'white';
        controlPanel.style.padding = '10px';
        controlPanel.style.borderRadius = '5px';
        controlPanel.style.zIndex = '9999';
        controlPanel.style.fontFamily = 'Arial, sans-serif';

        // Speed control label and input.
        const speedLabel = document.createElement('span');
        speedLabel.textContent = 'Speed: ';
        controlPanel.appendChild(speedLabel);

        const speedInput = document.createElement('input');
        speedInput.type = 'number';
        speedInput.value = video.playbackRate;
        speedInput.step = '0.1';
        speedInput.min = '0.1';
        speedInput.style.width = '50px';
        speedInput.addEventListener('change', function() {
            video.playbackRate = parseFloat(this.value);
        });
        controlPanel.appendChild(speedInput);

        controlPanel.appendChild(document.createTextNode(' '));

        // Button to skip ahead 10 seconds.
        const skipButton = document.createElement('button');
        skipButton.textContent = 'Skip 10s';
        skipButton.style.marginLeft = '5px';
        skipButton.addEventListener('click', function() {
            allowedTime = video.currentTime + 10;
            video.currentTime = allowedTime;
        });
        controlPanel.appendChild(skipButton);

        // Button to rewind 10 seconds.
        const rewindButton = document.createElement('button');
        rewindButton.textContent = 'Rewind 10s';
        rewindButton.style.marginLeft = '5px';
        rewindButton.addEventListener('click', function() {
            allowedTime = video.currentTime - 10;
            if (allowedTime < 0) allowedTime = 0;
            video.currentTime = allowedTime;
        });
        controlPanel.appendChild(rewindButton);

        // Checkbox to auto skip non-video audio.
        const autoSkipAudioCheckbox = document.createElement('input');
        autoSkipAudioCheckbox.type = 'checkbox';
        autoSkipAudioCheckbox.id = 'autoSkipAudioCheckbox';
        autoSkipAudioCheckbox.style.marginLeft = '10px';
        autoSkipAudioCheckbox.addEventListener('change', function() {
            autoSkipAudio = this.checked;
        });
        controlPanel.appendChild(autoSkipAudioCheckbox);

        const autoSkipAudioLabel = document.createElement('label');
        autoSkipAudioLabel.textContent = ' Auto skip non-video audio';
        autoSkipAudioLabel.htmlFor = 'autoSkipAudioCheckbox';
        controlPanel.appendChild(autoSkipAudioLabel);

        document.body.appendChild(controlPanel);
    }

    // When the user (or Edgenuity) attempts to seek, force the video to remain at or above allowedTime.
    function overrideSeeking() {
        video.addEventListener('seeking', function() {
            // If the new currentTime is less than allowedTime, push it back.
            if (video.currentTime < allowedTime) {
                video.currentTime = allowedTime;
            }
        });
    }

    // Function to skip all non-video audio if enabled.
    function skipNonVideoAudio() {
        if (!autoSkipAudio) return;
        document.querySelectorAll('audio').forEach(function(audio) {
            // If the audio is playing and hasn't reached its end, skip it.
            if (!audio.paused && audio.currentTime < audio.duration) {
                audio.currentTime = audio.duration;
                audio.pause();
            }
        });
    }

    // Check periodically for audio elements to skip.
    setInterval(skipNonVideoAudio, 500);

    // Wait for the video element to appear. Use a MutationObserver in case it isn’t present immediately.
    function waitForVideo() {
        video = document.querySelector('video');
        if (video) {
            // Initialize allowedTime as the current time.
            allowedTime = video.currentTime;
            createControlPanel();
            overrideSeeking();
        } else {
            // In case the video element is loaded later, observe the document.
            const observer = new MutationObserver((mutations, obs) => {
                video = document.querySelector('video');
                if (video) {
                    allowedTime = video.currentTime;
                    createControlPanel();
                    overrideSeeking();
                    obs.disconnect();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }

    waitForVideo();
})();
