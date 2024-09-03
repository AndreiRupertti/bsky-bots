# Bsky  bots

### Description

Group of bots for BlueSky


### Requirements

- Node v22.6
- Docker Compose

### How to Run:

##### Step 1

- Install dependencies: `npm ci`

##### Step 2

- Create `.env`: Copy `.env.template` to `.env`
```
cat .env.template >> .env
```

##### Step 3

- Development Mode: `npm run dev`
- Building: `npm run build`
- Production Mode: Set `.env` to `NODE_ENV="production"` then `npm run build && npm run start`