
nats pub out-subj.msgs '{
    "specversion": "1.0",
    "type": "com.example.message",
    "source": "nats-cli",
    "id": "1",
    "datacontenttype": "application/json",
    "data": {
      "user_id": "user123",
      "message": "Hello from CloudEvent"
    }
  }'

nats pub ctx-subj.msgs '{
    "specversion": "1.0",
    "type": "com.example.message",
    "source": "nats-cli",
    "id": "1",
    "datacontenttype": "application/json",
    "data": {
      "user_id": "user123",
      "message": "Hello from CloudEvent"
    }
  }'
