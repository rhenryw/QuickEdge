// ==UserScript==
// @name         QuickEdge by RHW (Toggle Speed Enforcement)
// @namespace    https://github.com/tf7software/QuickEdge
// @version      1.5
// @description  Skip Audio/Video on Edgenuity + enforce turbo speed toggle
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

(function() {
    'use strict';

    // Override played property to mark video as watched
    Object.defineProperty(HTMLMediaElement.prototype, 'played', {
        get: function() {
            return {
                length: 1,
                start: () => 0,
                end: () => this.duration
            };
        },
        configurable: true
    });

    let video;
    let allowedTime = 0;
    let autoSkipAudio = false;
    let desiredSpeed = 1;
    let speedToggleInterval = null;
    let toggleState = false;

    function createControlPanel() {
        const controlPanel = document.createElement('div');
        Object.assign(controlPanel.style, {
            position: 'fixed', top: '10px', right: '10px',
            background: 'rgba(0, 0, 0, 0.6)', color: 'white',
            padding: '10px', borderRadius: '5px', zIndex: '9999',
            fontFamily: 'Arial, sans-serif'
        });

        const speedLabel = document.createElement('span');
        speedLabel.textContent = 'Speed: ';
        controlPanel.appendChild(speedLabel);

        const speedInput = document.createElement('input');
        speedInput.type = 'number';
        speedInput.value = video.playbackRate;
        speedInput.step = '0.1';
        speedInput.min = '0.1';
        speedInput.style.width = '50px';
        speedInput.addEventListener('change', () => {
            clearInterval(speedToggleInterval);
            desiredSpeed = parseFloat(speedInput.value) || 1;
            // Start toggling between desiredSpeed and desiredSpeed - 1
            toggleState = false;
            speedToggleInterval = setInterval(() => {
                video.playbackRate = toggleState
                    ? desiredSpeed
                    : Math.max(0.1, desiredSpeed - 1);
                toggleState = !toggleState;
            }, 500);
        });
        controlPanel.appendChild(speedInput);

        controlPanel.appendChild(document.createTextNode(' '));

        // Skip and rewind buttons… (unchanged)
        // [existing skip/rewind and audio skip code here]

        document.body.appendChild(controlPanel);
    }

    function overrideSeeking() {
        video.addEventListener('seeking', () => {
            if (video.currentTime < allowedTime) {
                video.currentTime = allowedTime;
            }
        });
    }

    function skipNonVideoAudio() {
        if (!autoSkipAudio) return;
        document.querySelectorAll('audio').forEach(audio => {
            if (!audio.paused && audio.currentTime < audio.duration) {
                audio.currentTime = audio.duration;
                audio.pause();
            }
        });
    }
    setInterval(skipNonVideoAudio, 500);

    function waitForVideo() {
        video = document.querySelector('video');
        if (video) {
            allowedTime = video.currentTime;
            createControlPanel();
            overrideSeeking();
        } else {
            const obs = new MutationObserver((m, o) => {
                video = document.querySelector('video');
                if (video) {
                    allowedTime = video.currentTime;
                    createControlPanel();
                    overrideSeeking();
                    o.disconnect();
                }
            });
            obs.observe(document.body, { childList: true, subtree: true });
        }
    }

    waitForVideo();
})();
