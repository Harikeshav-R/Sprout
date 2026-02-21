import uuid
from typing import List, Optional

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.models.outreach import OutreachEmail, OutreachEmailCreate, OutreachStatus


async def create_outreach_email(session: AsyncSession, outreach_in: OutreachEmailCreate) -> OutreachEmail:
    outreach = OutreachEmail.model_validate(outreach_in)
    session.add(outreach)
    await session.commit()
    await session.refresh(outreach)
    return outreach


async def get_outreach_email(session: AsyncSession, id: uuid.UUID) -> Optional[OutreachEmail]:
    return await session.get(OutreachEmail, id)


async def get_outreach_emails(
        session: AsyncSession, *, farm_id: Optional[uuid.UUID] = None, status: Optional[OutreachStatus] = None,
        offset: int = 0, limit: int = 100
) -> List[OutreachEmail]:
    query = select(OutreachEmail)
    if farm_id:
        query = query.where(OutreachEmail.farm_id == farm_id)
    if status:
        query = query.where(OutreachEmail.status == status)
    result = await session.exec(query.offset(offset).limit(limit))
    return result.all()


async def update_outreach_status(
        session: AsyncSession, *, outreach: OutreachEmail, status: OutreachStatus
) -> OutreachEmail:
    outreach.status = status
    session.add(outreach)
    await session.commit()
    await session.refresh(outreach)
    return outreach
