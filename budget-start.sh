#!/bin/bash

SESSION_NAME="server"
LOG_DIR="logs"
LOG_FILE="$LOG_DIR/server.log"
RESTART_INTERVAL=${RESTART_INTERVAL:-1800}  # 30 minutes by default

# Check if tmux is available
command -v tmux >/dev/null 2>&1 || { echo "tmux is required but not installed. Aborting." >&2; exit 1; }

# Create logs directory if it doesn't exist
mkdir -p $LOG_DIR

# Kill existing session
tmux has-session -t $SESSION_NAME 2>/dev/null
if [ $? == 0 ]; then
   echo "Killing existing session..."
   tmux kill-session -t $SESSION_NAME
fi

# Build client first
cd ./client
npm run build

if [ $? -ne 0 ]; then
   echo "Build failed, not starting the server."
   exit 1
fi

# Reset to starting directory
cd ..

# Create tmux session
tmux new-session -d -s $SESSION_NAME

# Setup trap for cleanup
cleanup() {
    echo "Shutting down server..."
    tmux kill-session -t $SESSION_NAME
    exit 0
}
trap cleanup SIGINT SIGTERM

# Create a restart loop with improved process management
tmux send-keys -t $SESSION_NAME "export NODE_ENV=production" C-m
tmux send-keys -t $SESSION_NAME "cd server" C-m
tmux send-keys -t $SESSION_NAME "while true; do" C-m
tmux send-keys -t $SESSION_NAME "  echo \"\$(date '+%Y-%m-%d %H:%M:%S'): Starting server...\" | tee -a $LOG_FILE" C-m
tmux send-keys -t $SESSION_NAME "  npm run start >> $LOG_FILE 2>&1 & SERVER_PID=\$!" C-m
tmux send-keys -t $SESSION_NAME "  echo \"Server PID: \$SERVER_PID\" >> $LOG_FILE" C-m
tmux send-keys -t $SESSION_NAME "  sleep $RESTART_INTERVAL" C-m
tmux send-keys -t $SESSION_NAME "  echo \"\$(date '+%Y-%m-%d %H:%M:%S'): Gracefully stopping server...\" | tee -a $LOG_FILE" C-m
tmux send-keys -t $SESSION_NAME "  kill -SIGTERM \$SERVER_PID" C-m
tmux send-keys -t $SESSION_NAME "  timeout=30" C-m
tmux send-keys -t $SESSION_NAME "  while kill -0 \$SERVER_PID 2>/dev/null && [ \$timeout -gt 0 ]; do" C-m
tmux send-keys -t $SESSION_NAME "    sleep 1" C-m
tmux send-keys -t $SESSION_NAME "    ((timeout--))" C-m
tmux send-keys -t $SESSION_NAME "  done" C-m
tmux send-keys -t $SESSION_NAME "  if kill -0 \$SERVER_PID 2>/dev/null; then" C-m
tmux send-keys -t $SESSION_NAME "    echo \"Force killing server...\" >> $LOG_FILE" C-m
tmux send-keys -t $SESSION_NAME "    kill -9 \$SERVER_PID" C-m
tmux send-keys -t $SESSION_NAME "  fi" C-m
tmux send-keys -t $SESSION_NAME "  sleep 5" C-m
tmux send-keys -t $SESSION_NAME "done" C-m

echo "Server started in tmux session '$SESSION_NAME' with ${RESTART_INTERVAL}s restart cycle"
echo "Logs available in $LOG_FILE"

# Keep script running to handle signals
while true; do sleep 86400; done