# i know, but it's almosy 1am and I want to see this run
#!/bin/bash


# Static name for the tmux session
SESSION_NAME="server"

# Kill the existing tmux session with the name "server" if it exists
tmux has-session -t $SESSION_NAME 2>/dev/null
if [ $? == 0 ]; then
    tmux kill-session -t $SESSION_NAME
fi

# Navigate to the client directory and run build
cd ./client
npm run build

# Check if the build was successful
if [ $? -ne 0 ]; then
    echo "Build failed, not starting the server."
    exit 1
fi

# Create a new tmux session for the server, detached, and set NODE_ENV to production
tmux new-session -d -s $SESSION_NAME
tmux send-keys -t $SESSION_NAME "export NODE_ENV=production" C-m
tmux send-keys -t $SESSION_NAME "cd ../server" C-m
tmux send-keys -t $SESSION_NAME "npm run start" C-m

echo "Server started in tmux session '$SESSION_NAME'"