/**
 * SCENARIO CONFIGURATION
 * 
 * Defines the flow of the game, video sources, and interaction events.
 */

export const scenarios = {
    "start": {
        id: "start",
        videoSrc: "assets/video_1.mp4", // Placeholder
        next: "fail", // Default fallback if no interaction
        loop: false,
        events: [
            {
                id: "qte_1",
                timeStart: 1.6, // Seconds in
                timeDuration: 1.5, // How long it stays on screen
                type: "click",
                style: { top: "30%", left: "30%" },
                label: "ACT!",
                next: "win" // If successful, goto this scene
            }
        ]
    },
    "win": {
        id: "win",
        videoSrc: "assets/video_2.mp4",
        next: null, // End of line or loop back?
        loop: false,
        isEnd: true,
        endTitle: "SUCCESS",
        endMessage: ""
    },
    "fail": {
        id: "fail",
        videoSrc: "assets/video_3.mp4",
        next: null,
        loop: false,
        isEnd: true,
        endTitle: "FAILED",
        endMessage: "You were too slow."
    }
};
