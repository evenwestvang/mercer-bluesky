#!/bin/bash

SESSION_NAME="server"
LOG_DIR="logs"
LOG_FILE="${LOG_DIR}/server_$(date +%Y%m%d_%H%M%S).log"

# Create logs directory if it doesn't exist
mkdir -p $LOG_DIR

# Kill existing session
tmux has-session -t $SESSION_NAME 2>/dev/null
if [ $? == 0 ]; then
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

# Create tmux session and initialize environment
tmux new-session -d -s $SESSION_NAME

# Create a restart loop in the tmux session with logging
tmux send-keys -t $SESSION_NAME "export NODE_ENV=production" C-m
tmux send-keys -t $SESSION_NAME "cd server" C-m
tmux send-keys -t $SESSION_NAME "while true; do" C-m
tmux send-keys -t $SESSION_NAME "  echo '$(date): Starting server...' >> $LOG_FILE 2>&1" C-m
tmux send-keys -t $SESSION_NAME "  npm run start >> $LOG_FILE 2>&1 & SERVER_PID=\$!" C-m
tmux send-keys -t $SESSION_NAME "  sleep 1800" C-m  # 30 minutes
tmux send-keys -t $SESSION_NAME "  echo '$(date): Restarting server...' >> $LOG_FILE 2>&1" C-m
tmux send-keys -t $SESSION_NAME "  kill \$SERVER_PID 2>> $LOG_FILE" C-m
tmux send-keys -t $SESSION_NAME "  sleep 5" C-m  # Give it time to shut down cleanly
tmux send-keys -t $SESSION_NAME "done" C-m

echo "Server started in tmux session '$SESSION_NAME' with 30-minute restart cycle"
echo "Logs available in $LOG_FILE"