// ==UserScript==
// @name         YouTube Minimal Video Saver + UI
// @namespace    https://github.com/Beyazprens/youtube-minimal-video-saver
// @version      1.0.0
// @description  Saves YouTube watch progress, resumes videos automatically, and cleans up completed entries.
// @author       Beyazprens
// @match        https://www.youtube.com/*
// @license      MIT
// @homepageURL  https://github.com/Beyazprens/youtube-minimal-video-saver
// @supportURL   https://github.com/Beyazprens/youtube-minimal-video-saver/issues
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_registerMenuCommand
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const PREFIX = "yt_min_save_";
    const DELETE_THRESHOLD = 0.95;
    const SAVE_INTERVAL = 2000;

    let video = null;
    let videoId = null;
    let lastSave = 0;

    window.addEventListener("yt-navigate-finish", init, false);
    init();

    function init() {
        const params = new URLSearchParams(location.search);
        videoId = params.get("v");
        if (!videoId) return;

        waitForVideo().then(v => {
            video = v;
            restore(videoId, video);
            setupVideoEvents(videoId, video);
        });
    }

    function waitForVideo() {
        return new Promise(resolve => {
            let v = document.querySelector("video.html5-main-video");
            if (v) return resolve(v);

            const obs = new MutationObserver(() => {
                v = document.querySelector("video.html5-main-video");
                if (v) {
                    obs.disconnect();
                    resolve(v);
                }
            });

            obs.observe(document.body, { childList: true, subtree: true });
        });
    }

    function setupVideoEvents(id, vid) {
        vid.addEventListener("timeupdate", () => {
            if (!vid.duration || !isFinite(vid.duration)) return;

            const percent = vid.currentTime / vid.duration;

            // Over 95% watched → delete saved progress
            if (percent > DELETE_THRESHOLD) {
                GM_deleteValue(PREFIX + id);
                return;
            }

            const now = Date.now();
            if (now - lastSave > SAVE_INTERVAL && vid.currentTime > 5) {
                save(id, vid.currentTime);
                lastSave = now;
            }
        });
    }

    function save(id, time) {
        GM_setValue(PREFIX + id, JSON.stringify({
            id,
            time,
            title: getCleanTitle(),
            date: Date.now()
        }));
    }

    function getCleanTitle() {
        return (
            document.title
                .replace(/^\(\d+\)\s/, "")
                .replace(" - YouTube", "") ||
            "Unknown Video"
        );
    }

    function restore(id, vid) {
        const raw = GM_getValue(PREFIX + id);
        if (!raw) return;

        const data = JSON.parse(raw);

        if (vid.duration && data.time > vid.duration * DELETE_THRESHOLD) {
            GM_deleteValue(PREFIX + id);
            return;
        }

        vid.currentTime = data.time;
    }

    GM_registerMenuCommand("📜 Manage Saved Videos", showUI);

    function showUI() {
        const existing = document.getElementById("yms-modal");
        if (existing) existing.remove();

        const keys = GM_listValues().filter(k => k.startsWith(PREFIX));
        const items = keys
            .map(k => JSON.parse(GM_getValue(k)))
            .sort((a, b) => b.date - a.date);

        const modal = document.createElement("div");
        modal.id = "yms-modal";
        modal.innerHTML = `
            <div class="yms-window">
                <div class="yms-header">
                    <h2>Saved Videos (${items.length})</h2>
                    <button id="yms-close">✖</button>
                </div>
                <div class="yms-list">
                    ${items.length === 0 ? `<p class="yms-empty">No saved videos.</p>` : ""}
                </div>
                <div class="yms-footer">
                    <button id="yms-clear-all">Clear All</button>
                </div>
            </div>

            <style>
                #yms-modal {
                    position: fixed;
                    top:0; left:0;
                    width:100%; height:100%;
                    background:rgba(0,0,0,0.8);
                    z-index:999999;
                    display:flex;
                    justify-content:center;
                    align-items:center;
                }
                .yms-window {
                    width:480px;
                    background:#1f1f1f;
                    color:#fff;
                    border-radius:10px;
                    display:flex;
                    flex-direction:column;
                    max-height:80vh;
                }
                .yms-header {
                    padding:12px 16px;
                    border-bottom:1px solid #333;
                    display:flex;
                    justify-content:space-between;
                }
                .yms-list {
                    overflow-y:auto;
                    padding:10px;
                    flex-grow:1;
                }
                .yms-item {
                    padding:10px;
                    border-bottom:1px solid #333;
                    display:flex;
                    justify-content:space-between;
                }
                .yms-title {
                    color:#3ea6ff;
                    text-decoration:none;
                    font-weight:bold;
                }
                .yms-time {
                    font-size:12px;
                    color:#aaa;
                }
                #yms-close {
                    background:none;
                    border:none;
                    color:#aaa;
                    font-size:20px;
                    cursor:pointer;
                }
                #yms-clear-all {
                    background:#c00;
                    color:#fff;
                    border:none;
                    padding:8px 12px;
                    margin:10px;
                    cursor:pointer;
                    border-radius:6px;
                }
                .yms-empty {
                    text-align:center;
                    padding:20px;
                    color:#999;
                }
            </style>
        `;

        document.body.appendChild(modal);

        const list = modal.querySelector(".yms-list");

        items.forEach(item => {
            const mins = Math.floor(item.time / 60);
            const secs = String(Math.floor(item.time % 60)).padStart(2, "0");

            const row = document.createElement("div");
            row.className = "yms-item";
            row.innerHTML = `
                <div>
                    <a class="yms-title" href="/watch?v=${item.id}" target="_blank">${item.title}</a>
                    <div class="yms-time">Resume at: ${mins}:${secs}</div>
                </div>
                <button class="yms-del"
                        data-id="${item.id}"
                        style="background:#900;color:#fff;border:none;padding:6px;border-radius:4px;cursor:pointer;">
                    Delete
                </button>
            `;
            list.appendChild(row);
        });

        modal.querySelector("#yms-close").onclick = () => modal.remove();
        modal.onclick = e => { if (e.target === modal) modal.remove(); };

        list.querySelectorAll(".yms-del").forEach(btn => {
            btn.onclick = function () {
                GM_deleteValue(PREFIX + this.dataset.id);
                this.parentElement.remove();
            };
        });

        modal.querySelector("#yms-clear-all").onclick = () => {
            if (confirm("Are you sure you want to delete all saved videos?")) {
                keys.forEach(k => GM_deleteValue(k));
                list.innerHTML = `<p class="yms-empty">All saved videos have been deleted.</p>`;
            }
        };
    }

})();
