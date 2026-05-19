# Usability 

To ensure a seamless user experience across all devices, particularly on extreme mobile constraints, several proactive UX/UI enhancements were implemented:

## 1. Anti-Overflow
A common usability issue in threaded discussions is that deep nesting pushes content off-screen on mobile devices. 
* **Dynamic Indentation:** Implemented CSS custom properties (`--depth`) to dynamically scale indentation. On desktop, it scales by 30px per level, but on mobile (< 768px), it shrinks to 8px.
* **Word Wrap & Break:** Applied `overflow-wrap: break-word` and `min-width: 0` to comment containers to strictly prevent long continuous strings from breaking the viewport width and causing horizontal scrolling.

## 2. Adaptive Action Buttons 
The action buttons (Like, Watch, Edit, Delete) dynamically adapt to prevent text overflow when states change (e.g., "Like" changing to "Unlike").
* **Desktop:** Utilized `flex: 1` to distribute buttons equally across the container. This ensures that text changes do not cause adjacent buttons to shift abruptly, maintaining visual stability.
* **Mobile (400px):** Buttons gracefully collapse into a 100%-width vertical stack. This prevents the UI from breaking and provides a much larger, native-app-like tap target for mobile users.

## 3. "Squashed Meta" Prevention
Prevented character-level line breaking for the "Likes" token in deeply nested, constrained flex containers.
* Enforced `white-space: nowrap` and `flex-shrink: 0` on the Likes counter, ensuring the metric remains perfectly readable. If space is critically low, the flex container wraps cleanly to a new line instead of overlapping with the author's name.

## 4. Native App-Like Scrolling Constraints
To prevent the "double scrollbar" issue, the main `body` is locked using a strict flex-column layout with `overflow: hidden`. Scrolling is delegated exclusively to the internal containers (`#thread-container`, `#sidebar`), mimicking the smooth, controlled experience of a native desktop or mobile application.