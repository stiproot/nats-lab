# docker-compose -f docker-compose.dapr-placement.yml up -d

dapr run \
    --app-id data-svc \
    --app-port 3001 \
    --dapr-http-port 3501 \
    --dapr-grpc-port 50001 \
    --resources-path ../dapr/components.local \
    --placement-host-address localhost:50006 \
    --scheduler-host-address localhost:50007 \
    -- npm run dev
