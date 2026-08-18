FROM node:24-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends fontconfig fonts-roboto \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# The renderer registers these exact paths. Copy the Debian Roboto TTFs into
# the project so Canvas does not depend on the npm package's font layout.
RUN mkdir -p /app/node_modules/roboto-fontface/fonts/roboto \
  && cp /usr/share/fonts/truetype/roboto/unhinted/RobotoTTF/Roboto-Regular.ttf /app/node_modules/roboto-fontface/fonts/roboto/Roboto-Regular.ttf \
  && cp /usr/share/fonts/truetype/roboto/unhinted/RobotoTTF/Roboto-Medium.ttf /app/node_modules/roboto-fontface/fonts/roboto/Roboto-Medium.ttf \
  && cp /usr/share/fonts/truetype/roboto/unhinted/RobotoTTF/Roboto-Bold.ttf /app/node_modules/roboto-fontface/fonts/roboto/Roboto-Bold.ttf \
  && cp /usr/share/fonts/truetype/roboto/unhinted/RobotoTTF/Roboto-Black.ttf /app/node_modules/roboto-fontface/fonts/roboto/Roboto-Black.ttf \
  && fc-cache -f

ENV NODE_ENV=production

CMD ["npm", "start"]
