# Weight of Light — original sound system

`src/audio.js` generates the score and effects with the Web Audio API. There are no third-party samples, audio downloads, recorded voices, or remote services. The synthesis and motifs were authored for this episode. Source is editable with the rest of the project.

The score combines inharmonic glass partials, quiet triangle-wave strings, low wooden impulses, and filtered noise for a cable's rising tension and settling platform. The four chapters change tonal centers. Lit homes add quiet upper harmonics; hearing the recording adds an answering motif. The homes ending uses a major palette and fuller rhythm, while the memorial keeps a sparse minor motif. These are musical treatments, not spoken narration. The mother's message is presented as localized text in the game.

Call `await sound.unlock()` only after an intentional user action. `setSettings({music, effects, muted})` controls independent buses with smooth gain changes; values are clamped to 0–1. The UI owns persistence. `setState({chapter, lamps, heard, ending})` follows game state, and `play(type)` accompanies an action. `pause()` stops scheduled voices and the clock and suspends the context. `resume()` restarts an already unlocked context without replaying elapsed music. `destroy()` cancels the clock, stops and disconnects voices and buses, and closes the context. This module does not register document or global event handlers.

The game remains playable when Web Audio is missing, a device is disconnected, or browser autoplay policy prevents playback. `unlock()` and `resume()` return a boolean; no audio capability is required for puzzle transitions. A lightweight compressor and restrained master gain reduce peaks, but perceived volume depends on the player's device and operating-system mixer.

Validation covers AudioContext creation after a gesture, action generation, state-dependent scheduling, mixer controls, pause/resume, and disposal. A browser synthesis check establishes graph execution, not listening quality on physical headphones or a phone. Device listening and final loudness judgment remain useful release checks.
