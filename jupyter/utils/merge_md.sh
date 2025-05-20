#!/bin/bash

# Remove all.md if it already exists to ensure a clean merge
if [ -f all.md ]; then
  rm all.md
fi

# Iterate over all .md files in the current directory and concatenate them into all.md
for f in *.md; do
  if [ -f "$f" ]; then # Ensure it's a regular file and not a directory
    cat "$f" >> all.md
    echo "" >> all.md # Add a newline between files for better readability
  fi
done

echo "All .md files merged into all.md"