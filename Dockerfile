FROM ubuntu:24.04
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl && rm -rf /var/lib/apt/lists/*
COPY --chmod=0755 dist/biotropy-server /usr/local/bin/biotropy-server
COPY --chmod=0755 frontend/dist/ /app/public/
# A new named volume copies this ownership, so the unprivileged server can write checkpoints.
RUN mkdir -p /data && chown 65532:65532 /data
USER 65532:65532
EXPOSE 8095
CMD ["/usr/local/bin/biotropy-server"]
