# Bonus Features

## 1. Intelligent Polling & Race Condition Mitigation
Implemented a robust 2-second background polling mechanism for watched threads that strictly adheres to the Vanilla JS and Promise-only constraints, without overwhelming the UI with unnecessary DOM repaints.

## 2. Modern 100dvh Dynamic Viewport Support
To maximize mobile usability, the layout utilizes the modern CSS `dvh` unit instead of the traditional `vh`.
* **Reason:** On mobile browsers (like iOS Safari or Chrome), the address bar dynamically expands and shrinks, which often hides the bottom footer or action areas in standard `100vh` layouts. By using `min-height: 100dvh`, the Single Page Application perfectly fits the true visible canvas at all times, ensuring the sticky footer and scrollable areas remain perfectly accessible without being obscured by the browser's native UI.