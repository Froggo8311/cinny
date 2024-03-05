# Neocinny
A clean Matrix client focusing primarily on a professional & user-friendly interface.

## Getting started
Neocinny is available at https://cinny2.vercel.app.

<!--You can also download the desktop app from [cinny-desktop repository](https://github.com/cinnyapp/cinny-desktop).-->

You can serve neocinny with a webserver of your choice by simply copying `dist/` directory to the webroot. 
To set default Homeserver on login and register page, place a customized [`config.json`](config.json) in webroot of your choice.

## Local development
Execute the following commands to start a development server:
```sh
npm ci # Installs all dependencies
npm start # Serve a development version
```

To build the app:
```sh
npm run build # Compiles the app into the dist/ directory
```

### Running with Docker
This repository includes a Dockerfile, which builds the application from source and serves it with Nginx on port 80. To
use this locally, you can build the container like so:
```
docker build -t cinny:latest .
```

You can then run the container you've built with a command similar to this:
```
docker run -p 8080:80 cinny:latest
```

This will forward your `localhost` port 8080 to the container's port 80. You can visit the app in your browser by navigating to `http://localhost:8080`.
