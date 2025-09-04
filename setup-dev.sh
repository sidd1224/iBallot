#!/bin/bash
#
# iBallot Developer Setup Script
#
# This script checks for and installs the Doppler CLI, then prompts for login.
# It only needs to be run once by each developer on a new machine.

echo "--- iBallot Developer Setup ---"

# Check if Doppler is installed
if ! command -v doppler &> /dev/null
then
    echo "Doppler CLI not found. Installing now..."
    # Install Doppler CLI
    (curl -Ls https://cli.doppler.com/install.sh || wget -qO- https://cli.doppler.com/install.sh) | sh
else
    echo "Doppler CLI is already installed."
fi

# Prompt for Doppler login
echo ""
echo "Please log in to your Doppler account. A browser window will open."
doppler login

echo ""
echo "✅ Setup complete! You can now run the project with: doppler run -- docker compose up"
