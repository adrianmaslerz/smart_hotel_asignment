#!/bin/bash

set -e

echo "Waiting for MinIO to be ready..."
sleep 10

# Create bucket if it doesn't exist
/usr/local/bin/mc alias set minio http://localhost:9000 minioadmin minioadmin
/usr/local/bin/mc mb minio/smart-hotel --ignore-existing

echo "Bucket 'smart-hotel' created successfully"

