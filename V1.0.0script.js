// ==UserScript==
// @name         GeoFS 737 Immersion V1.0.0
// @namespace    https://geo-fs.com/
// @version      1.0.0
// @description  Stable base: show/hide window, external lights (visual only), autobrake dropdown, custom sound URLs
// @author       Eli Smidt
// @match        https://www.geo-fs.com/geofs.php
// @run-at       document-end
// @grant        none
// follow me on github! https://www.github.com/ultimatedude13
//follow me on scratch! https://www.scratch.mit.edu/users/ultimatedude13
// ==/UserScript==

(function () {
    "use strict";

    // -------------------------
    // BUILT-IN SOUNDS (YOUR URLs)
    // -------------------------
    const touchdownSound = new Audio("https://sites.google.com/view/elismidtcodedevcenter/touchdown-mp3");
    const reverseSound   = new Audio("https://sites.google.com/view/elismidtcodedevcenter/reverse-mp3");
    const ambienceSound  = new Audio("https://sites.google.com/view/elismidtcodedevcenter/ambience-mp3");

    touchdownSound.volume = 0.9;
    reverseSound.volume   = 0.8;
    ambienceSound.volume  = 0.4;
    ambienceSound.loop    = true;

    let lastOnGround = false;
    let lastSpeed = 0;
    let reversePlaying = false;

    // -------------------------
    // UI WINDOW (NON-DRAGGABLE)
    // -------------------------
    function createWindow() {
        const win = document.createElement("div");
        win.id = "immersionWin";
        win.style.position = "fixed";
        win.style.top = "80px";
        win.style.left = "20px";
        win.style.width = "240px";
        win.style.background = "rgba(0,0,0,0.75)";
        win.style.color = "#fff";
        win.style.padding = "10px";
        win.style.borderRadius = "6px";
        win.style.zIndex = "99999";
        win.style.fontFamily = "Arial";
        win.style.fontSize = "13px";

        win.innerHTML = `
            <b>737 Immersion V1.0.0</b><br><br>

            <label>
                <input type="checkbox" id="toggleWindow" checked>
                Show / Hide Panel
            </label><br><br>

            <div id="panelContent">

                <b>External Lights (Visual Only)</b><br>
                <label><input type="checkbox" id="lightLanding"> Landing Lights</label><br>
                <label><input type="checkbox" id="lightBeacon"> Beacon</label><br>
                <label><input type="checkbox" id="lightLogo"> Logo Lights</label><br>
                <label><input type="checkbox" id="lightStrobe"> Strobe Lights</label><br>
                <label><input type="checkbox" id="lightNav"> Navigation Lights</label><br>
                <label><input type="checkbox" id="lightTaxi"> Taxi Lights</label><br><br>

                <b>Autobrake</b><br>
                <select id="autobrakeLevel">
                    <option value="OFF">OFF</option>
                    <option value="LOW">LOW</option>
                    <option value="MED">MED</option>
                    <option value="MAX">MAX</option>
                </select><br><br>

                Status: <span id="immersionStatus">Waiting…</span>
            </div>
        `;

        document.body.appendChild(win);

        hookShowHide();
    }

    // -------------------------
    // SHOW / HIDE PANEL
    // -------------------------
    function hookShowHide() {
        const toggle = document.getElementById("toggleWindow");
        const content = document.getElementById("panelContent");

        toggle.addEventListener("change", () => {
            content.style.display = toggle.checked ? "block" : "none";
        });
    }

    // -------------------------
    // IMMERSION ENGINE
    // -------------------------
    function startImmersion() {
        setInterval(() => {
            const anim = geofs.animation.values;
            const ac = geofs.aircraft.instance;

            const statusEl = document.getElementById("immersionStatus");
            statusEl.textContent = "Active";

            const onGround = !!anim.onGround;
            const speed = anim.ias || 0;
            const reverse = anim.reverseThrust || 0;

            // Touchdown
            if (onGround && !lastOnGround && lastSpeed > 60) {
                touchdownSound.currentTime = 0;
                touchdownSound.play().catch(() => {});
            }

            // Reverse thrust
            if (onGround && reverse > 0.1 && !reversePlaying) {
                reversePlaying = true;
                reverseSound.currentTime = 0;
                reverseSound.play().catch(() => {});
            } else if ((!onGround || reverse <= 0.1) && reversePlaying) {
                reversePlaying = false;
                reverseSound.pause();
            }

            // Cockpit ambience
            const view = geofs.view.current;
            const cockpit = view && (view.id === "cockpit" || view.id === "cockpit3d");

            if (cockpit && ambienceSound.paused) {
                ambienceSound.play().catch(() => {});
            }
            if (!cockpit && !ambienceSound.paused) {
                ambienceSound.pause();
            }

            // -------------------------
            // AUTOBRAKE DROPDOWN LOGIC
            // -------------------------
            const level = document.getElementById("autobrakeLevel").value;

            if (onGround) {
                if (level === "LOW" && speed < 80) ac.setControl("brake", 0.3);
                if (level === "MED" && speed < 100) ac.setControl("brake", 0.6);
                if (level === "MAX" && speed < 120) ac.setControl("brake", 1.0);
                if (level === "OFF") ac.setControl("brake", 0);
            }

            lastOnGround = onGround;
            lastSpeed = speed;

        }, 50);
    }

    // -------------------------
    // WAIT FOR GEOFS
    // -------------------------
    function waitForGeoFS() {
        if (window.geofs && geofs.animation && geofs.aircraft) {
            createWindow();
            startImmersion();
        } else {
            requestAnimationFrame(waitForGeoFS);
        }
    }

    waitForGeoFS();
})();
