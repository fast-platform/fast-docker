# Use alpine-node image with nodejs v8
FROM mhart/alpine-node:8

# Intsall dependencies
RUN apk add --no-cache make gcc g++ python nginx git ca-certificates openssl

# Fix missing directories in alpine for nginx
RUN mkdir -p /tmp/nginx/client-body && mkdir -p /run/nginx

# Clone Form.io server
RUN git clone https://github.com/formio/formio.git /src/formio

# Clone Form.io client
RUN git clone https://github.com/formio/formio-app-formio.git /src/formio/client

# Define the working directory
WORKDIR /src/formio

# Downgrade npm (https://github.com/npm/npm/issues/19989#issuecomment-372155119)
RUN npm install -g npm@5.6.0

# Install packages
RUN npm install

# Fix for connecting to Mongodb Atlas cluster
RUN npm remove mongoose && npm install mongoose@5.0.15

# Copy the templates directory
COPY templates ./templates

# Copy configuration and scripts
COPY config ./config
COPY scripts/* ./

# Copy nginx configuration and ssl certificate directory
COPY nginx.conf /etc/nginx/nginx.conf
COPY ssl /etc/nginx/ssl

# Generate Diffie-Hellman parameters
RUN openssl dhparam -out /etc/nginx/ssl/dhparam.pem 2048

# Generate SSL Certificates
RUN openssl req -config /etc/nginx/ssl/lvh.me.conf -new -sha256 -newkey rsa:2048 -nodes -keyout /etc/nginx/ssl/lvh.me.key -x509 -days 365 -out /etc/nginx/ssl/lvh.me.crt -subj "/C=IT/ST=Lazio/L=Rome/O=FAO Food and Agriculture Organization of the United Nations/OU=FAO/CN=*.lvh.me"

# Clean-up
RUN rm -rf /var/cache/apk/*

CMD [ "sh", "./start.sh"]