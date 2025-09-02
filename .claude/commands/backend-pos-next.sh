#!/bin/bash

# Backend POS Development - Next Task
# Resumes backend POS development by working on the next pending task

echo "🚀 Backend POS Development - Resuming Next Task"
echo "==============================================="

# Check if progress file exists
if [ ! -f "BACKEND_POS_PROGRESS.md" ]; then
    echo "❌ Error: BACKEND_POS_PROGRESS.md not found"
    echo "Please run the initial setup first"
    exit 1
fi

# Check if plan file exists
if [ ! -f "BACKEND_POS_PLAN.md" ]; then
    echo "❌ Error: BACKEND_POS_PLAN.md not found"
    echo "Please create the backend POS plan first"
    exit 1
fi

echo "📋 Reading current progress from BACKEND_POS_PROGRESS.md..."
echo "📖 Reading implementation plan from BACKEND_POS_PLAN.md..."
echo ""

# Show current status
echo "📊 Current Project Status:"
echo "------------------------"
grep -E "^## Current Status:|^Overall Progress:" BACKEND_POS_PROGRESS.md | head -2
echo ""

# Find the current phase
current_phase=$(grep -E "^## Phase.*⏳|^## Phase.*🔄" BACKEND_POS_PROGRESS.md | head -1 | sed 's/## //' | sed 's/ ⏳//' | sed 's/ 🔄//')

if [ -z "$current_phase" ]; then
    # Find the first pending phase
    current_phase=$(grep -E "^## Phase.*⏸️" BACKEND_POS_PROGRESS.md | head -1 | sed 's/## //' | sed 's/ ⏸️//')
fi

if [ -z "$current_phase" ]; then
    echo "🎉 All backend POS phases completed!"
    echo "Check BACKEND_POS_PROGRESS.md for final status"
    exit 0
fi

echo "🎯 Current Phase: $current_phase"
echo ""

# Show database status
if command -v psql >/dev/null 2>&1; then
    echo "🗄️  Database Connection Check:"
    if pg_isready -h postgres -p 5432 >/dev/null 2>&1; then
        echo "  ✅ PostgreSQL is running"
    else
        echo "  ⚠️  PostgreSQL connection check failed"
        echo "     Ensure PostgreSQL is running on postgres:5432"
    fi
else
    echo "🗄️  PostgreSQL client not available for connection check"
fi
echo ""

echo "🔨 Initiating task with Claude Code..."
echo "Claude will now:"
echo "  1. Analyze current progress and identify next task"
echo "  2. Implement the identified task following Go architecture"
echo "  3. Update database models/migrations as needed"
echo "  4. Update progress tracking"
echo "  5. Test the implementation"
echo "  6. Commit changes"
echo ""

# The actual implementation will be handled by Claude Code
# This script serves as documentation and user interface