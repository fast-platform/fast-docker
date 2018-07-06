# Use alpine-node image with nodejs v8
FROM mhart/alpine-node:8

# Intsall dependencies
RUN apk add --no-cache make gcc g++ python git

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

# Fix missing 'node--paginate-anything' module - https://github.com/formio/formio/issues/615
RUN npm install node-paginate-anything

# Copy the templates directory
COPY templates ./templates

# Copy configuration and scripts
COPY config ./config
COPY scripts/* ./

# Clean-up
RUN rm -rf /var/cache/apk/*

EXPOSE 3001

CMD [ "npm", "start"]