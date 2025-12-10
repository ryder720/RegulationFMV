import { scenarios } from './scenarios.js';

class GameEngine {
    constructor() {
        this.video = document.getElementById('main-video');
        this.uiLayer = document.getElementById('ui-layer');
        this.gameUI = document.getElementById('game-ui');
        this.interactionContainer = document.getElementById('interaction-container');
        this.debugInfo = document.getElementById('debug-info');

        // Debug helper: visualize layer
        // this.interactionContainer.style.border = "2px solid rgba(0,255,0,0.3)"; 

        this.currentSceneId = null;
        this.currentSceneConfig = null;
        this.activeEvents = new Set();
        this.processedEvents = new Set(); // Track fired events to prevent re-triggering after resume
        this.isPlaying = false;
        this.eventTimer = null; // Store timer for pause duration

        // Bindings
        this.update = this.update.bind(this);
        this.handleVideoEnded = this.handleVideoEnded.bind(this);

        // Listeners
        this.video.addEventListener('timeupdate', this.update);
        this.video.addEventListener('ended', this.handleVideoEnded);

        // Start Screen
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame('start');
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.resetGame();
        });
    }

    startGame(sceneId) {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('active');
        document.getElementById('end-screen').classList.add('hidden');
        document.getElementById('end-screen').classList.remove('active');

        this.gameUI.classList.remove('hidden');
        this.gameUI.classList.add('active');

        this.loadScene(sceneId);
    }

    resetGame() {
        this.startGame('start');
    }

    loadScene(sceneId) {
        console.log(`Loading scene: ${sceneId}`);
        const config = scenarios[sceneId];

        if (!config) {
            console.error(`Scene ${sceneId} not found!`);
            return;
        }

        this.currentSceneId = sceneId;
        this.currentSceneConfig = config;
        this.activeEvents.clear();
        this.processedEvents.clear();
        this.interactionContainer.innerHTML = ''; // Clear old QTEs

        if (this.eventTimer) clearTimeout(this.eventTimer);

        // If it's an end state without video, or just static, handle it (though we assume video for now)
        if (config.isEnd && !config.videoSrc) {
            this.showEndScreen(config.endTitle, config.endMessage);
            return;
        }

        this.video.src = config.videoSrc;
        this.video.loop = config.loop || false;

        // Play
        this.video.play().then(() => {
            this.isPlaying = true;
        }).catch(e => {
            // console.warn("Video play failed (likely missing file). Starting DEBUG SIMULATION.", e);
            // this.startDebugSimulation();
            // Suppressing auto-debug for now if user has provided files but they are just failing or loading
            console.error("Video failed to play", e);
        });
    }

    startDebugSimulation() {
        this.isPlaying = true;
        this.debugSimulationInterval = setInterval(() => {
            if (!this.isPlaying) return;
            // Simulate 100ms passing every 100ms
            // We can't write to this.video.currentTime reliably if src is bad, so we'll internalize time for debug?
            // Actually, we can just trigger the update loop manually with a fake time if we want.
            // But better: let's warn the user on UI.
            if (this.video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE || this.video.error) {
                // Mock time for testing events
                if (this.mockTime === undefined) this.mockTime = 0;
                this.mockTime += 0.1;
                this.handleDebugUpdate(this.mockTime);
            }
        }, 100);
    }

    handleDebugUpdate(mockTime) {
        this.debugInfo.style.display = 'block';
        this.debugInfo.innerText = `DEBUG MODE: MockTime: ${mockTime.toFixed(1)}s`;

        // Run logic with mockTime
        this.runGameLogic(mockTime);

        // Mock video end
        // Arbitrary 10s duration for debug
        if (mockTime > 10) {
            this.mockTime = 0;
            clearInterval(this.debugSimulationInterval);
            this.handleVideoEnded();
        }
    }

    update() {
        if (!this.currentSceneConfig) return;
        // if paused for QTE, don't run game logic that depends on time advancing? 
        // Actually we need to be careful. if video is paused, currentTime doesn't move.
        // So this loop is safe.
        this.runGameLogic(this.video.currentTime);
    }

    runGameLogic(currentTime) {
        // Check for events
        if (this.currentSceneConfig.events) {
            this.currentSceneConfig.events.forEach(event => {
                // If we are in the start window AND haven't processed it yet
                // Note: We ignore "timeDuration" for the window end check here if we treat it as a point trigger
                // But let's keep the window logic: [start, start + 0.5s] window to trigger? 
                // Getting strict: if currentTime >= start
                if (currentTime >= event.timeStart && !this.processedEvents.has(event.id)) {
                    this.triggerEvent(event);
                }
            });
        }

        // Debugging
        // this.debugInfo.innerText = `Time: ${currentTime.toFixed(2)} | Scene: ${this.currentSceneId}`;
    }

    triggerEvent(eventConfig) {
        this.activeEvents.add(eventConfig.id);
        this.processedEvents.add(eventConfig.id); // Mark as processed immediately

        console.log(`Triggering event: ${eventConfig.id}`);
        this.debugInfo.innerText = `EVENT TRIGGERED: ${eventConfig.id}`;
        this.debugInfo.style.display = 'block';

        // PAUSE VIDEO
        this.video.pause();
        this.isPlaying = false; // logic flag

        const el = document.createElement('div');
        el.className = 'qte-button';
        el.id = `event-${eventConfig.id}`;
        el.innerText = eventConfig.label || "!";

        // Position
        if (eventConfig.style) {
            Object.assign(el.style, eventConfig.style);
        }

        // Interaction
        el.addEventListener('pointerdown', (e) => {
            e.stopPropagation(); // prevent underlying clicks if any
            this.handleEventSuccess(eventConfig);
        });

        this.interactionContainer.appendChild(el);

        // Start Timer for the Duration of the Pause
        this.eventTimer = setTimeout(() => {
            this.handleEventTimeout(eventConfig);
        }, eventConfig.timeDuration * 1000);
    }

    handleEventTimeout(eventConfig) {
        console.log("Event Timeout - Resuming");
        this.removeEvent(eventConfig); // Remove UI

        // Resume Video -> Failure path (eventually ends)
        this.video.play();
        this.isPlaying = true;
    }

    removeEvent(eventConfig) {
        this.activeEvents.delete(eventConfig.id);
        const el = document.getElementById(`event-${eventConfig.id}`);
        if (el) el.remove();
        this.debugInfo.style.display = 'none';
    }

    handleEventSuccess(eventConfig) {
        console.log("Event Success!");
        if (this.eventTimer) clearTimeout(this.eventTimer);

        this.removeEvent(eventConfig);

        if (eventConfig.next) {
            this.loadScene(eventConfig.next);
        } else {
            // If success but no next scene (unlikely for QTE), just resume?
            this.video.play();
            this.isPlaying = true;
        }
    }

    handleVideoEnded() {
        console.log("Video Ended");
        if (this.currentSceneConfig && this.currentSceneConfig.isEnd) {
            this.showEndScreen(this.currentSceneConfig.endTitle, this.currentSceneConfig.endMessage);
        } else if (this.currentSceneConfig && this.currentSceneConfig.next) {
            this.loadScene(this.currentSceneConfig.next);
        } else {
            // Default Fallback
            console.warn("No next scene defined, ending.");
            this.showEndScreen("THE END", "Scenario Completed");
        }
    }

    showEndScreen(title, message) {
        this.isPlaying = false;
        this.gameUI.classList.add('hidden');
        this.video.pause();

        const endScreen = document.getElementById('end-screen');
        document.getElementById('end-title').innerText = title || "GAME OVER";
        document.getElementById('end-reason').innerText = message || "";

        endScreen.classList.remove('hidden');
        endScreen.classList.add('active');
    }
}

// Initialize
const game = new GameEngine();
