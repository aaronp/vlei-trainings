# vLEI Training


[This project](https://github.com/aaronp/vlei-trainings) is a [fork](https://github.com/gleif-it/vlei-trainings) of the [GLEIF-IT/vlei-trainings](./training.md) which adds [additional services](./docs/readme.md) on top of the reference KERI services:

 * An API which drives end-user flows
 * A command-line user interface
 * A web UI

## Running

To start the services, run:

```sh
cd bff/api
make start  # starts all services
```

Run the CLI:
```sh
cd bff/api/cli
make start  # starts all services
```