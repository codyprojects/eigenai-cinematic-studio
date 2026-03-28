# Project Plan: AI Short Video Platform

## 🎯 Vision
Create a comprehensive web platform that transforms text prompts into cinematic short videos using the **EigenAI API Suite** (Text, Image, Audio, Video) and **FFmpeg**.

## 🛠 Tech Stack
- **Frontend:** React, Vite, TypeScript, Tailwind CSS
- **Backend:** Node.js (Express), EigenAI SDK, FFmpeg

---

## 📈 Milestones

### Milestone 1: Script Generation
- [ ] **Input:** UI for user text prompt.
- [ ] **AI Call:** Interface with EigenAI Text Model (System Prompt: Movie Script Writer).
- [ ] **Data:** Parse response into structured scenes (ID, Description, Dialogues, Actions).
- [ ] **UI:** Interactive table display with CRUD (Edit/Delete) operations.

### Milestone 2: Scene Image Generation
- [ ] **AI Call:** EigenAI Image Model using scene description.
- [ ] **State:** Asynchronous generation with "Loading/Generating" button states.
- [ ] **UI:** Render thumbnails in table; click to view high-res fullscreen.

### Milestone 3: Audio & Voice Cloning
- [ ] **Character Setup:** Extract characters from script; toggle voice profiles (e.g., Linda/Jack).
- [ ] **Voice Clone:** Microphone interface for user to record 10s reference -> `upload_voice_reference`.
- [ ] **Generation:** Generate per-dialogue audio using character-specific `voice_id` or default profiles.
- [ ] **UI:** Inline audio players for each dialogue line.

### Milestone 4: Video Scene Generation
- [ ] **AI Call:** EigenAI Video Model (Image-to-Video) using scene image + description.
- [ ] **Job Management:** Poll `task_id` for completion; update UI with real-time status.
- [ ] **UI:** Mini-video player/preview within the scene table.

### Milestone 5: Action Image Editing & Video
- [ ] **Action Images:** Use EigenAI Image Editing to modify scene images based on "Action" text.
- [ ] **Action Videos:** Generate video clips specifically for these action-modified images.
- [ ] **Table Refinement:** Move visual assets (Images/Videos) into Description/Action columns for better layout.

### Milestone 6: Final Cinematic Assembly (FFmpeg)
- [ ] **Logic:** Stitch all scene videos, action videos, and audios sequence-wise.
- [ ] **Padding:** Use static images to pad video length if audio duration exceeds video duration.
- [ ] **Output:** Generate final .mp4 download link and primary video player.
- [ ] **UI:** "Generate Final Video" button with status tracking and playback.

---

## 🎨 Design Notes
- **Aesthetics:** Dark mode with premium glassmorphism effects.
- **UX:** Non-blocking asynchronous updates for all AI generations.
- **Responsive:** Optimized for desktop-first cinematic editing.