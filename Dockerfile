FROM node:24-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends fontconfig fonts-roboto \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .

# Canvas uses a deterministic, project-local font path. Debian's font package
# layout can vary, so locate the TTFs instead of hard-coding a distro path.
RUN mkdir -p /app/node_modules/roboto-fontface/fonts/roboto \
  && find /usr/share/fonts -type f -name 'Roboto-Regular.ttf' -exec cp {} /app/node_modules/roboto-fontface/fonts/roboto/Roboto-Regular.ttf \; -quit \
  && find /usr/share/fonts -type f -name 'Roboto-Medium.ttf' -exec cp {} /app/node_modules/roboto-fontface/fonts/roboto/Roboto-Medium.ttf \; -quit \
  && find /usr/share/fonts -type f -name 'Roboto-Bold.ttf' -exec cp {} /app/node_modules/roboto-fontface/fonts/roboto/Roboto-Bold.ttf \; -quit \
  && find /usr/share/fonts -type f -name 'Roboto-Black.ttf' -exec cp {} /app/node_modules/roboto-fontface/fonts/roboto/Roboto-Black.ttf \; -quit \
  && test -s /app/node_modules/roboto-fontface/fonts/roboto/Roboto-Regular.ttf \
  && test -s /app/node_modules/roboto-fontface/fonts/roboto/Roboto-Bold.ttf \
  && fc-cache -f

ENV NODE_ENV=production
CMD ["npm", "start"]
