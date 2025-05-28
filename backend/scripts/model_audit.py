"""Script to audit SQLAlchemy model relationships."""
import inspect
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.append(str(backend_dir))

from app.models import *  # noqa
from sqlalchemy import inspect as sa_inspect

def audit_models():
    """Find all SQLAlchemy models and their relationships."""
    for name, obj in globals().items():
        if inspect.isclass(obj) and hasattr(obj, '__tablename__'):
            print(f"\n=== {name} (table: {obj.__tablename__}) ===")
            mapper = sa_inspect(obj)
            
            # Show relationships
            for rel in mapper.relationships:
                print(f"  relationship: {rel.key} -> {rel.mapper.class_.__name__}")
                if hasattr(rel, 'local_remote_pairs'):
                    local_cols = [col.name for col, _ in rel.local_remote_pairs]
                    remote_cols = [col.name for _, col in rel.local_remote_pairs]
                    print(f"    local columns: {local_cols}")
                    print(f"    remote columns: {remote_cols}")
            
            # Show foreign keys
            for col in mapper.columns:
                if col.foreign_keys:
                    for fk in col.foreign_keys:
                        target = f"{fk.column.table.name}.{fk.column.name}"
                        print(f"  foreign_key: {col.name} -> {target}")


if __name__ == "__main__":
    audit_models() 