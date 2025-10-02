
dapr run \
    --app-id out-svc \
    --app-port 3000 \
    --dapr-http-port 3500 \
    --dapr-grpc-port 50001 \
    --resources-path ./dapr/components.local \
    --placement-host-address localhost:50006 \
    -- npm run dev