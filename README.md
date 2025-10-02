# NATS

## NATS Core

Install:

```sh
brew install nats-io/nats-tools/nats
```

Run server:

```sh
nats server run
```

Set context:

```sh
nats context select nats_development
```

### Request-Response

```sh
nats reply foo.bar.baz "Jesus loves you"
```

```sh
nats request foo.bar.baz "Thank You"
```

### Streaming

```sh
nats sub foo.bar.baz
```

```sh
nats pub foo.bar.baz "John 3:16"
```

```sh
nats pub foo.bar.baz "John 3:16" --count=-1 --sleep=1s
```

Q group is a way to load balance messages between multiple subscribers.

```sh
nats sub foo.bar.baz --queue=workers
```

```sh
nats reply "foo.*" --command "echo 'Received: {message}'"
```

Multiple repliers:

```sh
nats reply "foo.*" --command "echo 'Responder 1: {message}'" --queue=greeter --sleep=2s
nats reply "foo.*" --command "echo 'Responder 2: {message}'" --queue=greeter --sleep=1s
```

## NATS JetStream

Nats JetStream is a built-in persistence and streaming engine for NATS.

```sh
nats server run --jetstream
```

```sh
nats context select nats_development
```

```sh
nats stream ls
```

