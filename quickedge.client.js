// ==UserScript==
// @name         QuickEdge by RHW
// @namespace    https://github.com/tf7software/QuickEdge
// @version      1.7
// @description  Skip Audio/Video on Edgenuity + turbo speed toggle + skip non‑video audio
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

    // fool Edgenuity into thinking everything's been watched
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
    let toggleState = false;  // speed toggle: false = 1×, true = desiredSpeed

    function createControlPanel() {
        const panel = document.createElement('div');
        Object.assign(panel.style, {
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'rgba(0,0,0,0.6)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            zIndex: '9999',
            fontFamily: 'Arial,sans-serif'
        });


        const speedLabel = document.createElement('span');
        speedLabel.textContent = 'Speed: ';
        panel.appendChild(speedLabel);

        const speedInput = document.createElement('input');
        speedInput.type = 'number';
        speedInput.value = video.playbackRate.toFixed(1);
        speedInput.step = '0.1';
        speedInput.min = '0.1';
        speedInput.style.width = '50px';
        speedInput.addEventListener('change', () => {
            desiredSpeed = parseFloat(speedInput.value) || 1;
            if (toggleState) {
                video.playbackRate = desiredSpeed;
            }
        });
        panel.appendChild(speedInput);


        const speedBtn = document.createElement('button');
        speedBtn.textContent = 'Enable Turbo';
        speedBtn.style.margin = '0 5px';
        speedBtn.addEventListener('click', () => {
            toggleState = !toggleState;
            if (toggleState) {
                video.playbackRate = desiredSpeed;
                speedBtn.textContent = 'Disable Turbo';
            } else {
                video.playbackRate = 1;
                speedBtn.textContent = 'Enable Turbo';
            }
        });
        panel.appendChild(speedBtn);

        const audioBtn = document.createElement('button');
        audioBtn.textContent = 'Enable Skip Audio';
        audioBtn.style.marginLeft = '5px';
        audioBtn.addEventListener('click', () => {
            autoSkipAudio = !autoSkipAudio;
            audioBtn.textContent = autoSkipAudio
                ? 'Disable Skip Audio'
                : 'Enable Skip Audio';
        });
        panel.appendChild(audioBtn);

        document.body.appendChild(panel);
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
            const obs = new MutationObserver((mutations, observer) => {
                video = document.querySelector('video');
                if (video) {
                    allowedTime = video.currentTime;
                    createControlPanel();
                    overrideSeeking();
                    observer.disconnect();
                }
            });
            obs.observe(document.body, { childList: true, subtree: true });
        }
    }

    waitForVideo();
})();
