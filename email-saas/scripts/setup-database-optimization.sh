#!/bin/bash

# Quick Setup Script for Database Optimization
# Applies all optimizations in one command

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "=================================="
echo "Database Optimization Setup"
echo "=================================="
echo -e "${NC}"

# Load environment
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
elif [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

DATABASE_URL="${DATABASE_URL}"

if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}ERROR: DATABASE_URL not set${NC}"
  exit 1
fi

echo -e "${GREEN}✓${NC} Environment loaded"
echo ""

# 1. Apply Performance Indexes
echo -e "${BLUE}[1/5]${NC} Applying performance indexes..."
psql "$DATABASE_URL" -f database/migrations/performance-indexes.sql > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓${NC} Performance indexes applied"
else
  echo -e "${RED}✗${NC} Failed to apply indexes"
  exit 1
fi

# 2. Install Analytics Functions
echo -e "${BLUE}[2/5]${NC} Installing analytics functions..."
psql "$DATABASE_URL" -f database/functions/analytics-functions.sql > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓${NC} Analytics functions installed"
else
  echo -e "${RED}✗${NC} Failed to install analytics functions"
  exit 1
fi

# 3. Install Connection Pool Functions
echo -e "${BLUE}[3/5]${NC} Installing connection pool functions..."
psql "$DATABASE_URL" -f database/functions/connection-pool-functions.sql > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓${NC} Connection pool functions installed"
else
  echo -e "${RED}✗${NC} Failed to install connection pool functions"
  exit 1
fi

# 4. Update Statistics
echo -e "${BLUE}[4/5]${NC} Updating database statistics..."
psql "$DATABASE_URL" -c "ANALYZE;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓${NC} Statistics updated"
else
  echo -e "${YELLOW}⚠${NC} Failed to update statistics (non-critical)"
fi

# 5. Verify Installation
echo -e "${BLUE}[5/5]${NC} Verifying installation..."

# Count indexes
index_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" | xargs)
echo -e "  Indexes: ${GREEN}${index_count}${NC}"

# Count functions
function_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';" | xargs)
echo -e "  Functions: ${GREEN}${function_count}${NC}"

# Test connection pool health
pool_status=$(psql "$DATABASE_URL" -t -c "SELECT * FROM check_connection_pool_health();" 2>/dev/null | wc -l)
if [ $pool_status -gt 0 ]; then
  echo -e "  Connection pool: ${GREEN}OK${NC}"
else
  echo -e "  Connection pool: ${YELLOW}Not tested${NC}"
fi

echo ""
echo -e "${GREEN}✓${NC} Database optimization setup complete!"
echo ""

# Next Steps
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "1. Configure connection pooling in .env:"
echo "   DATABASE_URL=postgresql://postgres:[pass]@[host]:6543/postgres?pgbouncer=true"
echo ""
echo "2. Setup automated backups:"
echo "   chmod +x scripts/backup-database.sh"
echo "   crontab -e  # Add: 0 2 * * * /path/to/backup-database.sh"
echo ""
echo "3. Setup maintenance:"
echo "   chmod +x scripts/database-maintenance.sh"
echo "   crontab -e  # Add: 0 3 * * 0 /path/to/database-maintenance.sh"
echo ""
echo "4. Update your queries to use optimized functions:"
echo "   import { getCampaigns } from '@/lib/database/optimized-queries'"
echo ""
echo "📖 Full guide: DATABASE_OPTIMIZATION_GUIDE.md"
echo ""

exit 0
