# SDK example project
This project is a sandbox application made to showcase how to implement end-2-end encryption in a web application with the [Seald-SDK](https://docs.seald.io/en/sdk/).

The full documentation is available [here](https://docs.seald.io/en/sdk/example/).

This project consists in 6 consecutive branches, each with a dedicated guide to go from one step to the next:

| Step                                                                                                 | Description                                                          | Final result                                                                                 | Root branch                                                                              |
|------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------|----------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------|
| [Quick-start](https://docs.seald.io/en/sdk/example/quick-start.html)                                 | Basic integration of the Seald-SDK with password protection          | [`1-quick-start`](https://github.com/seald/sdk-example-project/tree/1-quick-start)           | [`master`](https://github.com/seald/sdk-example-project/tree/master)                     |
| [Password pre-derivation](https://docs.seald.io/en/sdk/example/pre-derivation.html)                  | Implements a pre-derivation of the authentication password           | [`2-pre-derivation`](https://github.com/seald/sdk-example-project/tree/2-pre-derivation)     | [`1-quick-start`](https://github.com/seald/sdk-example-project/tree/1-quick-start)       |
| [Cache the identity in localStorage](https://docs.seald.io/en/sdk/example/localstorage.html)         | Implements identity caching in the localstorage                      | [`3-localstorage`](https://github.com/seald/sdk-example-project/tree/3-localstorage)         | [`2-pre-derivation`](https://github.com/seald/sdk-example-project/tree/2-pre-derivation) |
| [Protection with 2-man-rule](https://docs.seald.io/en/sdk/example/2-man-rule.html)                   | Replacement of password protection with a protection with 2-man-rule | [`4-two-man-rule`](https://github.com/seald/sdk-example-project/tree/4-two-man-rule)         | [`3-localstorage`](https://github.com/seald/sdk-example-project/tree/3-localstorage)     |
| [Using 2-man-rule with SMS](https://docs.seald.io/en/sdk/example/2-man-rule.html#_2-man-rule-by-sms) | In 2-man-rule, changing email protection to SMS protection           | [`5-two-man-rule-sms`](https://github.com/seald/sdk-example-project/tree/5-two-man-rule-sms) | [`4-two-man-rule`](https://github.com/seald/sdk-example-project/tree/4-two-man-rule)     |

## Features
This project allows to:
 - create an account (e-mail address, name, password);
 - log in (e-mail address & password);
 - create chat rooms;
 - add & remove users from a chat room;
 - delete chat rooms;
 - send messages to rooms;
 - notify recipients when a new message arrives;
 - retrieve messages from rooms;
 - upload files and attach them to a message;
 - retrieve files;

## Architecture
The architecture is basic (though some would say it is overkill for a demo project):
- backend:
    - REST API implemented with [Express](https://expressjs.com/) and [`csurf`](https://github.com/expressjs/csurf), [`session`](https://github.com/expressjs/session), [`body-parser`](https://github.com/expressjs/body-parser), [`cookie-parser`](https://github.com/expressjs/cookie-parser) middlewares;
    - websockets implemented with [socket.io](https://socket.io/);
    - [SQLite](https://sqlite.org) database with [Sequelize](https://sequelize.org/);
- frontend:
    - React app created with the [official tool](https://github.com/facebook/create-react-app);
    - [`@material-ui/`](https://material-ui.com/) for most of the components;
    - bare [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) as the REST API client and [`socket.io-client`](https://github.com/socketio/socket.io-client) as the websocket client.

## Starting the project
### Development server
To start working on the project, you need to:
- install dependencies;
- set up the settings and environment variables (which vary from one branch to the other);
- start the development servers (which both have a *watch* feature).

On the backend, it opens a server on port `4000`:
```shell
cd backend
npm install
npm start
```

On the frontend, it opens a server on port `5173`:
```shell
cd frontend
npm install
npm run dev
```

### Docker setup
Then you can start the project with following command:
```
docker-compose up -d --build
```

It will build the frontend and serve it with nginx on `http://localhost` which will act as a reverse proxy for the backend.

## Settings

### Frontend

Settings of the frontend must be set in a `settings.json` file, located in the root directory of the webserver (volume
`/usr/share/nginx/html/settings.json` if used with provided `docker-compose.yml` file)

There is a `settings.example.json` in each branch which is a template of the `settings.json` you can copy & paste, you'll need to replace the values with the actual settings.

The following settings must be set:

| Settings                     | Description                           | Must be set in branches                 |
|------------------------------|---------------------------------------|-----------------------------------------|
| `APPLICATION_SALT`           | Salt used for pre-derivation          | `2-pre-derivation`, `3-localstorage`    |
| `APP_ID`                     | App ID                                | All                                     |
| `API_URL`                    | Seald API URL                         | All                                     |
| `KEY_STORAGE_URL`            | SSKS API URL                          | `4-two-man-rule`, `5-two-man-rule-sms`  |

**Warning:** Do not set settings if they are not required in the branch you run, otherwise there may be side effects.

### Backend

Settings of the backend must be set in a `settings.json` file; located in the root of the `backend` directory (volume
`/backend/settings.json` if used with provided `docker-compose.yml` file)

There is a `settings.example.json` in each branch which is a template of the `settings.json` you can copy & paste, you'll need to replace the values with the actual settings.

The following settings must be set:

| Settings               | Description                                                                                                                                                                            | Must be set in branches                |
|------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------|
| `HTTPS_ENABLED`        | Must be enabled if a reverse proxy implements HTTPS upstream of the server. The `Secure` attribute will be added to session cookies and Express will trust the `X-Forwarded-*` headers | All                                    |
| `SESSION_SECRET`       | Secret used to derive session cookies                                                                                                                                                  | All                                    |
| `JWT_SHARED_SECRET_ID` | JWT shared secret ID (for signup JWT)                                                                                                                                                  | All                                    |
| `JWT_SHARED_SECRET`    | JWT shared secret (for signup JWT)                                                                                                                                                     | All                                    |
| `APP_ID`               | App ID (for user licence & SSKS)                                                                                                                                                       | All                                    |
| `KEY_STORAGE_URL`      | API URL (for SSKS)                                                                                                                                                                     | `4-two-man-rule`, `5-two-man-rule-sms` |
| `KEY_STORAGE_APP_KEY`  | App Key (for SSKS)                                                                                                                                                                     | `4-two-man-rule`, `5-two-man-rule-sms` |

**Warning:** Do not set settings if they are not required in the branch you run, otherwise there may be side effects.

In addition, in production, you may want to set the `NODE_ENV` environment variable to `"production"`, to run the
`express` webserver in production mode.
