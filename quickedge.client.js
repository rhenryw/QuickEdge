// ==UserScript==
// @name         QuickEdge 1.2
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Skip ahead and change playback speed on Edgenuity videos—even if you haven’t already watched them fully.
// @author       https://rhw.one
// @match        *://*.edgenuity.com/*
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
