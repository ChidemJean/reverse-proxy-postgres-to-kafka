# Base image
FROM node:18-alpine as base

WORKDIR /opt/oracle

RUN wget https://download.oracle.com/otn_software/linux/instantclient/2112000/el9/instantclient-basiclite-linux.x64-21.12.0.0.0dbru.el9.zip
RUN unzip instantclient-basiclite-linux.x64-21.12.0.0.0dbru.el9.zip
RUN apk update && apk --no-cache add libaio libnsl libc6-compat curl
ENV LD_LIBRARY_PATH="/opt/oracle/instantclient_21_12"

RUN apk add --no-cache g++ make py3-pip libc6-compat tzdata
WORKDIR /app
# COPY package*.json ./
EXPOSE 8089

# configuração do timezone da imagem
RUN cp /usr/share/zoneinfo/America/Sao_Paulo /etc/localtime && \
    echo "America/Sao_Paulo" > /etc/timezone
# RUN apk del tzdata

RUN apk add --no-cache openssl

RUN mkdir -p /app/ssl && \
    openssl req -nodes -new -x509 -keyout /app/ssl/server.key -out /app/ssl/server.cert -days 365 -subj "/C=BR/ST=SP/L=SaoPaulo/O=MyOrg/OU=IT/CN=example.com"

ENV SSL_KEY_FILE="/app/ssl/server.key"
ENV SSL_CERT_FILE="/app/ssl/server.cert"
# ENV TZ=America/Sao_Paulo

# Builder stage
FROM base as builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Production stage
FROM base as production
WORKDIR /app

ENV NODE_ENV=production
RUN npm ci --omit=dev

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
USER nestjs

COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

CMD npm run start:prod

# Development stage
FROM base as dev
ENV NODE_ENV=development

RUN echo "http://dl-cdn.alpinelinux.org/alpine/edge/main" > /etc/apk/repositories && \
    echo "http://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories && \
    apk update && apk add --no-cache git zsh curl \
    && sh -c "$(curl -fsSL http://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" \
    && sed -i 's|/bin/ash|/bin/zsh|' /etc/passwd

CMD [ "tail", "-f", "/dev/null" ]