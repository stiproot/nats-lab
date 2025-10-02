docker-compose -f docker-compose.dapr-placement.yml up -d

dapr run \
    --app-id out-svc \
    --app-port 3000 \
    --dapr-http-port 3500 \
    --dapr-grpc-port 50001 \
    --resources-path ./dapr/components.local \
    --placement-host-address localhost:50006 \
    -- npm run dev

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
