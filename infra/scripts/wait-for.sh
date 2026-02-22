#!/bin/bash
# Wait for a service to be ready
set -e

host="$1"
port="$2"
shift 2
cmd="$@"

echo "Waiting for $host:$port..."

until nc -z "$host" "$port" 2>/dev/null; do
  sleep 1
done

echo "$host:$port is ready!"
exec $cmd
