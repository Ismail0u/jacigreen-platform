"""Add collaborator access and subscription fields.

Revision ID: 51ca87a918d2
Revises: dbf8b62da272
"""

from alembic import op
import sqlalchemy as sa


revision = "51ca87a918d2"
down_revision = "dbf8b62da272"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("subscription_tier", sa.String(length=30), nullable=False, server_default="starter"))
    op.add_column("users", sa.Column("subscription_status", sa.String(length=30), nullable=False, server_default="active"))
    op.add_column("users", sa.Column("subscription_valid_until", sa.DateTime(timezone=True), nullable=True))
    op.alter_column("users", "subscription_tier", server_default=None)
    op.alter_column("users", "subscription_status", server_default=None)


def downgrade() -> None:
    op.drop_column("users", "subscription_valid_until")
    op.drop_column("users", "subscription_status")
    op.drop_column("users", "subscription_tier")
