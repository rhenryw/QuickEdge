// ==UserScript==
// @name         QuickEdge by RHW
// @namespace    https://github.com/tf7software/QuickEdge
// @version      1.9
// @description  Skip Audio/Video on Edgenuity + turbo speed pulser + skip non‑video audio
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

    // Trick Edgenuity into thinking everything's watched
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
    let autoSkipAudio = false;       // whether to skip non‑video audio
    let desiredSpeed = 1;            // target turbo speed
    let speedToggleInterval = null;  // interval handle for enforcer
    let turboEnabled = false;        // whether the enforcer is running

    function createControlPanel() {
        const cp = document.createElement('div');
        Object.assign(cp.style, {
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'rgba(0,0,0,0.6)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            zIndex: '9999',
            fontFamily: 'Arial, sans-serif'
        });

 
        cp.appendChild(Object.assign(document.createElement('span'), { textContent: 'Speed: ' }));

        const inp = document.createElement('input');
        inp.type = 'number';
        inp.value = video.playbackRate.toFixed(1);
        inp.step = '0.1';
        inp.min = '0.1';
        inp.style.width = '50px';
        inp.addEventListener('change', () => {
            desiredSpeed = parseFloat(inp.value) || 1;
            if (turboEnabled) restartEnforcer();
        });
        cp.appendChild(inp);


        const turboBtn = document.createElement('button');
        turboBtn.textContent = 'Enable Turbo';
        turboBtn.style.margin = '0 5px';
        turboBtn.addEventListener('click', () => {
            turboEnabled = !turboEnabled;
            turboBtn.textContent = turboEnabled ? 'Disable Turbo' : 'Enable Turbo';
            if (turboEnabled) {
                startEnforcer();
            } else {
                stopEnforcer();
                video.playbackRate = 1;
            }
        });
        cp.appendChild(turboBtn);


        const audioBtn = document.createElement('button');
        audioBtn.textContent = 'Enable Skip Audio';
        audioBtn.style.marginLeft = '5px';
        audioBtn.addEventListener('click', () => {
            autoSkipAudio = !autoSkipAudio;
            audioBtn.textContent = autoSkipAudio ? 'Disable Skip Audio' : 'Enable Skip Audio';
        });
        cp.appendChild(audioBtn);

        document.body.appendChild(cp);
    }

    function startEnforcer() {
        let toggleState = false;
        clearInterval(speedToggleInterval);
        speedToggleInterval = setInterval(() => {
            video.playbackRate = toggleState
                ? desiredSpeed
                : Math.max(0.1, desiredSpeed - 1);
            toggleState = !toggleState;
        }, 100);
    }

    function stopEnforcer() {
        clearInterval(speedToggleInterval);
    }

    function restartEnforcer() {
        stopEnforcer();
        startEnforcer();
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
        document.querySelectorAll('audio').forEach(a => {
            if (!a.paused && a.currentTime < a.duration) {
                a.currentTime = a.duration;
                a.pause();
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
            const obs = new MutationObserver((_, o) => {
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
