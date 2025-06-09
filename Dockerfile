FROM alpine:latest AS prepare-stage

ARG ENVIRONMENT_NAME
ARG BRANCH_NAME

ENV BRANCH_NAME=${BRANCH_NAME}

WORKDIR /app

RUN apk update && apk add --no-cache git

RUN /bin/sh -c "git clone --single-branch --branch $BRANCH_NAME https://github.com/igorproc/tg-bot.git ."

COPY . .

FROM node:18.16.1

ARG ENVIRONMENT_NAME

ENV ENVIRONMENT_NAME=${ENVIRONMENT_NAME}

COPY --from=prepare-stage /app /app

WORKDIR /app

RUN /bin/sh -c "cp ./environment/.${ENVIRONMENT_NAME}.env .env"

RUN npm ci

RUN npm run train

COPY . .

CMD ["npm", "run", "start"]
