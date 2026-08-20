# Riftbound Arena — Original 2D Fighting Game

A mobile-first 2D browser fighting game using HTML5 Canvas, CSS3, JavaScript ES6+, Web Audio API, Node.js and Express.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Render

Create a new Web Service and connect this project/repository.

- Build command: `npm install`
- Start command: `npm start`
- Environment: Node
- The server automatically uses `process.env.PORT || 3000`.

## Controls

### Keyboard
- A / D: move
- W: jump
- J: light attack
- K: heavy attack
- L: dash
- U: special
- I: ultimate

### Mobile
Landscape orientation is recommended.
- Left: virtual joystick
- Right: Attack, Heavy, Jump, Dash, Special, Ultimate

## Project structure

- `server.js` — Express server
- `package.json` — dependency and start configuration
- `public/index.html` — game shell and menus
- `public/style.css` — responsive UI
- `public/game.js` — game engine, fighters, AI, rendering, input, audio and effects

## Notes

All visual effects are procedurally drawn. No external image, font, audio, or API dependency is required.
