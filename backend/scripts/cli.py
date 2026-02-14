#!/usr/bin/env python3
# =============================================================================
# BuildBidz - CLI Management Script
# =============================================================================

"""
CLI tools for BuildBidz development and administration.

Usage:
    python -m scripts.cli db migrate     # Run database migrations
    python -m scripts.cli db seed        # Seed sample data
    python -m scripts.cli db reset       # Reset database
    python -m scripts.cli sync tally     # Sync invoices to Tally
    python -m scripts.cli worker ocr     # Process pending OCR
    python -m scripts.cli report daily   # Generate daily report
"""

import asyncio
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import typer
import asyncpg
from rich.console import Console
from rich.table import Table
from rich.progress import Progress

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import settings
from app.db.session import get_db_pool

console = Console()
app = typer.Typer(help="BuildBidz CLI Management Tools")


# =============================================================================
# Database Commands
# =============================================================================

db_app = typer.Typer(help="Database management commands")
app.add_typer(db_app, name="db")


@db_app.command("status")
def db_status():
    """Check database connection status."""
    async def check():
        try:
            pool = await get_db_pool()
            async with pool.acquire() as conn:
                version = await conn.fetchval("SELECT version()")
                console.print(f"[green]✓ Connected to PostgreSQL[/green]")
                console.print(f"  Version: {version}")
                
                # Get table counts
                tables = await conn.fetch("""
                    SELECT schemaname, tablename 
                    FROM pg_tables 
                    WHERE schemaname = 'public'
                """)
                console.print(f"  Tables: {len(tables)}")
        except Exception as e:
            console.print(f"[red]✗ Connection failed: {e}[/red]")
            raise typer.Exit(1)
    
    asyncio.run(check())


@db_app.command("migrate")
def db_migrate(
    dry_run: bool = typer.Option(False, "--dry-run", help="Show migrations without running"),
):
    """Run database migrations."""
    import subprocess
    
    if dry_run:
        console.print("[yellow]Dry run - showing pending migrations[/yellow]")
    
    # Using Firebase Data Connect for DB operations
    result = subprocess.run(
        ["firebase", "dataconnect:sql:push" if not dry_run else "dataconnect:sql:diff"],
        capture_output=True,
        text=True,
    )
    
    if result.returncode == 0:
        console.print("[green]✓ Migrations applied successfully[/green]")
        console.print(result.stdout)
    else:
        console.print(f"[red]✗ Migration failed[/red]")
        console.print(result.stderr)
        raise typer.Exit(1)


@db_app.command("seed")
def db_seed(
    org: Optional[str] = typer.Option(None, "--org", help="Seed specific org"),
):
    """Seed database with sample data."""
    async def seed():
        pool = await get_db_pool()
        
        with console.status("Seeding database..."):
            seed_file = Path(__file__).parent.parent.parent / "supabase" / "seed.sql"
            
            if not seed_file.exists():
                console.print(f"[red]Seed file not found: {seed_file}[/red]")
                raise typer.Exit(1)
            
            sql = seed_file.read_text()
            
            async with pool.acquire() as conn:
                await conn.execute(sql)
        
        console.print("[green]✓ Seed data loaded successfully[/green]")
    
    asyncio.run(seed())


@db_app.command("stats")
def db_stats():
    """Show database statistics."""
    async def stats():
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            table = Table(title="Database Statistics")
            table.add_column("Table", style="cyan")
            table.add_column("Rows", justify="right")
            table.add_column("Size", justify="right")
            
            rows = await conn.fetch("""
                SELECT 
                    relname as table,
                    n_live_tup as rows,
                    pg_size_pretty(pg_relation_size(relid)) as size
                FROM pg_stat_user_tables
                ORDER BY n_live_tup DESC
                LIMIT 20
            """)
            
            for row in rows:
                table.add_row(row["table"], str(row["rows"]), row["size"])
            
            console.print(table)
    
    asyncio.run(stats())


# =============================================================================
# Sync Commands
# =============================================================================

sync_app = typer.Typer(help="Sync with external systems")
app.add_typer(sync_app, name="sync")


# @sync_app.command("tally")
# def sync_tally(
#     org_id: str = typer.Argument(..., help="Organization ID"),
#     days: int = typer.Option(30, "--days", help="Sync invoices from last N days"),
# ):
#     """Sync invoices to Tally."""
#     async def sync():
#         from app.services.integrations.tally import tally_service
#         
#         # Check Tally connection
#         connected = await tally_service.check_connection()
#         if not connected:
#             console.print("[red]✗ Cannot connect to Tally. Is it running?[/red]")
#             raise typer.Exit(1)
#         
#         console.print("[green]✓ Connected to Tally[/green]")
#         
#         pool = await get_db_pool()
#         
#         async with pool.acquire() as conn:
#             # Get pending invoices
#             invoices = await conn.fetch("""
#                 SELECT i.*, v.name as vendor_name
#                 FROM invoices i
#                 JOIN vendors v ON v.id = i.vendor_id
#                 WHERE i.org_id = $1 
#                 AND i.tally_synced = false
#                 AND i.invoice_date >= NOW() - INTERVAL '%s days'
#                 ORDER BY i.invoice_date
#             """ % days, org_id)
#             
#             console.print(f"Found {len(invoices)} invoices to sync")
#             
#             with Progress() as progress:
#                 task = progress.add_task("Syncing...", total=len(invoices))
#                 
#                 for inv in invoices:
#                     result = await tally_service.sync_invoice_to_tally(dict(inv))
#                     
#                     if result["success"]:
#                         await conn.execute(
#                             "UPDATE invoices SET tally_synced = true WHERE id = $1",
#                             inv["id"]
#                         )
#                         progress.update(task, advance=1)
#                     else:
#                         console.print(f"[yellow]⚠ Failed: {inv['invoice_number']}[/yellow]")
#             
#             console.print("[green]✓ Tally sync complete[/green]")
#     
#     asyncio.run(sync())


# @sync_app.command("neo4j")
# def sync_neo4j(
#     org_id: str = typer.Argument(..., help="Organization ID"),
#     full: bool = typer.Option(False, "--full", help="Full sync instead of incremental"),
# ):
#     """Sync knowledge graph to Neo4j."""
#     from app.workers.kg_sync_worker import sync_organization
#     
#     console.print(f"Queuing KG sync for org {org_id}...")
#     sync_organization.delay(org_id, full_sync=full)
#     console.print("[green]✓ Sync task queued[/green]")


# =============================================================================
# Worker Commands
# =============================================================================

worker_app = typer.Typer(help="Background worker utilities")
app.add_typer(worker_app, name="worker")


@worker_app.command("status")
def worker_status():
    """Check Celery worker status."""
    from app.workers.celery_app import celery_app
    
    inspect = celery_app.control.inspect()
    
    active = inspect.active()
    if active:
        for worker, tasks in active.items():
            console.print(f"[cyan]{worker}[/cyan]: {len(tasks)} active tasks")
    else:
        console.print("[yellow]No active workers[/yellow]")


@worker_app.command("ocr")
def worker_ocr(
    limit: int = typer.Option(10, "--limit", help="Max documents to process"),
):
    """Process pending OCR documents."""
    async def process():
        from app.workers.ocr_worker import process_document_ocr
        
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            docs = await conn.fetch("""
                SELECT id, name FROM documents
                WHERE ocr_status = 'pending'
                LIMIT $1
            """, limit)
            
            console.print(f"Found {len(docs)} pending documents")
            
            for doc in docs:
                console.print(f"  Processing: {doc['name']}")
                process_document_ocr.delay(str(doc["id"]))
            
            console.print("[green]✓ OCR tasks queued[/green]")
    
    asyncio.run(process())


# =============================================================================
# Report Commands
# =============================================================================

report_app = typer.Typer(help="Generate reports")
app.add_typer(report_app, name="report")


@report_app.command("daily")
def report_daily(
    org_id: str = typer.Argument(..., help="Organization ID"),
    output: Optional[str] = typer.Option(None, "--output", "-o", help="Output file"),
):
    """Generate daily summary report."""
    async def generate():
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            # Get stats
            stats = await conn.fetchrow("""
                SELECT
                    (SELECT COUNT(*) FROM documents WHERE org_id = $1 AND created_at >= CURRENT_DATE) as docs_today,
                    (SELECT COUNT(*) FROM invoices WHERE org_id = $1 AND created_at >= CURRENT_DATE) as invoices_today,
                    (SELECT COUNT(*) FROM rfis WHERE org_id = $1 AND created_at >= CURRENT_DATE) as rfis_today,
                    (SELECT COUNT(*) FROM daily_logs WHERE org_id = $1 AND log_date = CURRENT_DATE) as logs_today,
                    (SELECT COALESCE(SUM(total_workers), 0) FROM daily_logs WHERE org_id = $1 AND log_date = CURRENT_DATE) as workers_today
            """, org_id)
            
            report = f"""
# Daily Report - {datetime.now().strftime('%Y-%m-%d')}

## Activity Summary
- Documents uploaded: {stats['docs_today']}
- Invoices processed: {stats['invoices_today']}
- RFIs created: {stats['rfis_today']}
- Daily logs: {stats['logs_today']}
- Workers on site: {stats['workers_today']}
"""
            
            if output:
                Path(output).write_text(report)
                console.print(f"[green]Report saved to {output}[/green]")
            else:
                console.print(report)
    
    asyncio.run(generate())


# =============================================================================
# AI Commands
# =============================================================================

ai_app = typer.Typer(help="AI and LLM utilities")
app.add_typer(ai_app, name="ai")

@ai_app.command("groq-test")
def groq_test(
    prompt: str = typer.Option("Explain why construction software is important for India.", "--prompt", "-p"),
    model: str = typer.Option(None, "--model", "-m", help="Specific model to use (e.g., 20b, 120b)"),
):
    """Test Groq AI integration."""
    async def run_test():
        from app.services.ai import groq_service
        
        # Map shortcuts
        target_model = None
        if model == "20b":
            target_model = groq_service.model_20b
        elif model == "120b":
            target_model = groq_service.model_120b
        else:
            target_model = model
            
        console.print(f"[cyan]Testing Groq with model:[/cyan] {target_model or 'default'}")
        console.print(f"[cyan]Prompt:[/cyan] {prompt}")
        
        try:
            with console.status("Querying Groq..."):
                result = await groq_service.chat_completion(
                    [{"role": "user", "content": prompt}],
                    model=target_model
                )
                
            content = result.choices[0].message.content
            console.print("\n[bold green]Response from Groq:[/bold green]")
            console.print(content)
            console.print(f"\n[dim]Model: {result.model}[/dim]")
        except Exception as e:
            console.print(f"[red]✗ Groq test failed: {e}[/red]")
            raise typer.Exit(1)
            
    asyncio.run(run_test())


# =============================================================================
# Main
# =============================================================================

if __name__ == "__main__":
    app()
