# Interactive Video Engine

A lightweight, JavaScript-based engine for creating interactive full-motion video (FMV) experiences and "Choose Your Own Adventure" style games.

This project enables you to build branching video narratives with Quick Time Events (QTEs), timed decisions, and multiple endings, all running directly in the browser without heavy dependencies.

## Features

*   **Branching Narrative Support**: Link videos together based on user choices.
*   **Timed Interaction Events**: Trigger buttons and QTEs at specific timestamps during video playback.
*   **Success & Failure States**: Define different outcomes based on user interaction (or lack thereof).
*   **Configurable Scenarios**: All game logic is defined in a simple JSON-like structure (`scenarios.js`), making it easy to edit and expand.
*   **Responsive UI**: Clean, overlay-based UI for start screens, game over screens, and interactions.

## Project Structure

*   `index.html`: The main entry point containing the video player and UI layers.
*   `engine.js`: The core engine logic handling video playback, event timing, and state management.
*   `scenarios.js`: The configuration file where you define your scenes, videos, and events.
*   `style.css`: Styles for the visual presentation.

## Getting Started

### Prerequisites

You need a modern web browser. No compilation or backend server is strictly required, but a local server is recommended for testing due to browser security policies regarding local video files.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Add your assets:**
    *   Place your video files (MP4 recommended) in an `assets/` folder.

3.  **Run locally:**
    *   If you have Python installed: `python3 -m http.server`
    *   Or use VS Code's "Live Server" extension.
    *   Open `http://localhost:8000` in your browser.

## Usage

### Configuring Scenes

All gameplay logic is controlled via `scenarios.js`. You can define scenes with the following properties:

```javascript
export const scenarios = {
    // Unique ID for the scene
    "scene_id": {
        id: "scene_id",
        videoSrc: "assets/video_file.mp4",
        
        // Scene to jump to automatically if video ends (optional)
        next: "next_scene_id", 
        
        // Define interactive events
        events: [
            {
                id: "event_1",
                timeStart: 2.5,        // When the event appears (seconds)
                timeDuration: 3.0,     // How long the user has to react
                label: "CLICK ME!",    // Button text
                style: { top: "50%", left: "50%" }, // Position
                next: "success_scene"  // Scene to load on success
            }
        ]
    },
    
    // Ending Scene
    "game_over": {
        id: "game_over",
        isEnd: true,
        endTitle: "GAME OVER",
        endMessage: "You missed the button."
    }
};
```

### Adding Videos

Ensure your video files are optimized for web (H.264 MP4). Update the `videoSrc` paths in `scenarios.js` to match your file structure.

## Deployment to GitHub Pages

This project is static, making it perfect for GitHub Pages.

1.  Go to your repository settings on GitHub.
2.  Navigate to **Pages**.
3.  Under **Source**, select `main` (or `master`) branch and `/ (root)` folder.
4.  Click **Save**.
5.  Your game will be live at `https://your-username.github.io/your-repo-name/`.

## Customization

*   **Styling**: Edit `style.css` to change the look of buttons, fonts, and the overlay.
*   **Logic**: Modify `engine.js` if you need to add new types of interactions or complex state tracking.

## License

[MIT](LICENSE)
