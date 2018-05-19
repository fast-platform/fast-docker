# Formio API Server Docker Container

Docker container for [Form.io](https://form.io)'s open-source [API Server](https://github.com/formio/formio) based on Alpine Linux.

### Usage

To use this container, just pull the latest image from unfao/formio.

1. Create an external network

```
docker network create formio
```

2. Create the mongo instance (OPTIONAL) 
 
> You may skip this step and specify the mongodb connection string to the formio container instead using the `MONGO` environment variable.

```
docker run -itd  \
  --name formio-mongo \
  --network formio \
  --volume /opt/mongodb:/data/db \
  --restart unless-stopped \
  mongo;
```

3. Create the formio instance (remember to remove the mongo link if not using it)

```
docker run -itd \
    -e "DOMAIN=https://lvh.me:8443" \
    -e "ROOT_EMAIL=admin@example.com" \
    -e "ROOT_PASS=admin.123" \
    -e "USER_FORM=admin" \
    -e "USER_LOGIN_FORM=admin/login" \
    -e "MONGO_SECRET=CHANGEME" \
    -e "JWT_SECRET=CHANGEME" \
    --name formio-api \
    --network formio \
    --link formio-mongo:mongo \
    --restart unless-stopped \
    -p 8443:443 \
    unfao/formio
```

### Build

To build this docker container just clone the repository and build it to your liking using docker-compose.

```
git clone https://github.com/un-fao/fast-docker.git         # clone the repository
cd ./fast-docker                                       
cp template.env ./.env                                      # modify and save the .env file
docker-compose up -d                                        # fire-up the docker container
```

## Environment Configuration

The file `template.env` is provided as template for setting up the environment variables.  Once ready, save it as `.env` to build the docker image.

##### Docker Configuration

These are some of the environment variables available for configuring the docker container.  Check [template.env](template.env) for more examples and [custom-environment-variables.json](config/custom-environment-variables.json) to see how they map themselves into the API server configuration.

| Setting             | Description                                          | Example                         |
|------------------|------------------------------------------------------|---------------------------------|
| NETWORK          | The docker external network to attach the container. | `formio`                        |
| API_PORT         | The port for accessing the API server.               | `8443`                          |
| PROJECT_TEMPLATE | The project template variation to use (leave empty for default template). | `default`                        |
| ROOT_EMAIL    | The default root account email used when installing the Form.io API server. | `admin@example.com`                          |
| ROOT_PASSWORD    | The default root account password used when installing the Form.io API server.  | `admin.123`                          |
| MONGO         | The MongoDB connection string to connect to your remote database. | `mongodb://formio-mongo:27017/formioapp`|
| MONGO_SECRET | The database encryption secret.             | `FTFaVuIdSv4Hj2bjnwae`|
| MONGO_HIGH_AVAILABILITY| 	If your database is high availability (like from Mongo Cloud or Compose), then this needs to be set. | `1`|
| JWT_SECRET | The secret password for JWT token encryption.|`YilQ9E1wOiITdWOeaMCL`|
| JWT_EXPIRE_TIME | The expiration for the JWT Tokens. | `240`|
| EMAIL_TYPE | The default email transport type (`sendgrid` or `mandrill`). | `sendgrid`|
| EMAIL_USER | The sendgrid api_user string.| `sendgrid-user` |
| EMAIL_PASS | The sendgrid api_key string.| `sendgrid-pass` |
| EMAIL_KEY | The mandrill apiKey string. | `mandrill-key` |
| EMAIL_OVERRIDE | Provides a way to point all Email traffic to a server (ignores all other email configurations). | `{"transport":"smtp","settings":{"port":2525,"host":"smtp.mailtrap.io","auth":{"user":"23esdffd53ac","pass":"324csdfsdf989a"}}}` |


## Project Templates

To include a custom project template, save it on the [templates](templates) directory using the following naming convention: `project.<id>.json` (e.g.: `project.basic.json`).  To install a specific template, set the `PROJECT_TEMPLATE` value to the templates `<id>`.  The `default` id is reserved for Form.io's [default project template](https://github.com/formio/formio-app-formio/blob/master/dist/project.json). All projects templates should use Form.io's Project JSON Schema.

###### Example

You may have multiple project templates in your `templates` directory.

```
--- templates
    |--- project.basic.json
    |--- project.full.json
```

Then on your `.env` file you just need to specify which template to use:

```
PROJECT_TEMPLATE=full
```

If the mongodb database defined in the mongo connection string does not exist, then a new project will be initialized using the given project template.

## Authors

* **Alfredo Irarrazaval** - *Initial work* - [airarrazaval](https://github.com/airarrazaval)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
