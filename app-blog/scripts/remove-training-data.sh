#!/bin/bash

# Script to remove training data from the events directory
# This script will delete all event files marked as training data

echo "🗑️  Removing Training Data Events..."
echo ""

# Remove the main training data file
if [ -f "src/content/events/2025-01-01-TRAINING-DATA.json" ]; then
    echo "✓ Removing: 2025-01-01-TRAINING-DATA.json"
    rm "src/content/events/2025-01-01-TRAINING-DATA.json"
else
    echo "ℹ️  Training data file not found (already removed?)"
fi

# Also remove the example events file if it exists
if [ -f "src/content/events/2024-12-11.json" ]; then
    echo "✓ Removing: 2024-12-11.json (example data)"
    rm "src/content/events/2024-12-11.json"
else
    echo "ℹ️  Example data file not found (already removed?)"
fi

echo ""
echo "✅ Training data cleanup complete!"
echo ""
echo "Remaining event files:"
ls -la src/content/events/ 2>/dev/null || echo "No event files remaining"
