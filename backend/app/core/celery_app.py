from celery import Celery

from app.core.config import settings

"""
Celery application configuration for the JACIGREEN DroneSurveillance application.
This module sets up the Celery application with the necessary configurations for task processing. It defines the Celery instance, broker, backend, and other settings required for task execution. The Celery application
 is configured to use Redis as the message broker and result backend, and it includes the necessary task modules for processing AI-related tasks. The configuration also specifies serialization formats, timezone settings, and task tracking options to ensure efficient and reliable task execution within the application.
"""

celery_app = Celery(
    "jacigreen",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.workers.ai_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Africa/Niamey",
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)
