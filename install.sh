#!/bin/bash

echo "🔧 Installing BROKEN LORD WhatsApp Bot..."

apt update -y
apt upgrade -y

pkg install nodejs -y
pkg install git -y
pkg install ffmpeg -y
pkg install imagemagick -y

npm install

echo "✅ Installation complete!"
echo "Run: bash broken.sh"
