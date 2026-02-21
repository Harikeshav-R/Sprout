import uuid
from typing import List, Optional
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from src.models.transaction import Transaction, TransactionCreate

async def create_transaction(session: AsyncSession, transaction_in: TransactionCreate) -> Transaction:
    transaction = Transaction.model_validate(transaction_in)
    session.add(transaction)
    await session.commit()
    await session.refresh(transaction)
    return transaction

async def get_transaction(session: AsyncSession, id: uuid.UUID) -> Optional[Transaction]:
    return await session.get(Transaction, id)

async def get_transactions(
    session: AsyncSession, *, farm_id: Optional[uuid.UUID] = None, offset: int = 0, limit: int = 100
) -> List[Transaction]:
    query = select(Transaction)
    if farm_id:
        query = query.where(Transaction.farm_id == farm_id)
    result = await session.exec(query.offset(offset).limit(limit))
    return result.all()
