# NATS

NATS and JetStream:

- NATS: A lightweight, high-performance messaging system (pub/sub, request/reply, streaming, etc.).
- JetStream: An add-on to NATS that provides persistence and streaming features.
        - In plain NATS, messages are ephemeral (if a subscriber is offline, it misses them).
        - With JetStream, messages can be stored, replayed, acknowledged, and durable.

Concepts:

- Stream → A named collection of messages (backed by storage).
- Consumer → A subscription with state (where you left off, what’s been acked).
- Acknowledgments → Let JetStream know a message has been processed (so it won’t be redelivered unless needed).

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

```sh
nats stream add out-subj --storage file --subjects ai
```

```sh
nats sub --stream out-subj --new
```

```sh
nats consumer delete out-subj dapr-durable
```

```sh
nats-server -c src/out-svc/nats-dev.conf
```

```sh
nats stream info ctx-subj
```

## Command

`--command` allows you to attach an external shell command to a NATS message handler, meaning every time a message is received on a subject, your command is executed, and its output can optionally be sent back as a reply.

```sh
nats reply "foo.*" --command "echo 'Responder 1: {message}'"
```

“Listen for any message published to subjects matching foo.*.
When one arrives, run the given shell command — substituting message data into placeholders like {message} — and reply with the command’s output.”

Like a bridge between NATS and your shell environment.

```sh
nats reply "ai.qry.*" --command 'claude --prompt "{message}"' --queue=qry-responder --sleep=1s
```

```sh
nats request ai.qry.claude "Hi, how are you?"
```

```sh
nats sub "foo.*" --command 'result=$(echo "Processed {message}"); nats pub bar.results "$result"'
```

What’s happening here:

- nats sub listens for messages on foo.*
- When a message is received, it executes your shell command
- That shell command runs nats pub to publish the computed output to another subject (bar.results)

```sh
nats stream add ai \
        --storage file \
        --subjects ai \
        --retention limits \
        --replicas 1
```
