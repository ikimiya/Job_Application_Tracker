from sqlalchemy import Column, Integer, String, Date
from database import Base


class Job(Base):
    __tablename__ = "jobs"

    id              = Column(Integer, primary_key=True, index=True)
    company         = Column(String,  nullable=False)
    role            = Column(String,  nullable=False)
    job_description = Column(String,  nullable=True)
    website         = Column(String,  nullable=True)
    date_applied    = Column(Date,    nullable=False)
    status          = Column(String,  nullable=False, default="applied")
    notes           = Column(String,  nullable=True)