"""
Celery application configuration for background workers.
Handles the Discovery Loop and Liveness Loop scheduling.
"""

from celery import Celery
from celery.schedules import crontab
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Celery
celery_app = Celery(
    'liveprotestfinder',
    broker=os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
    backend=os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
    include=['workers.tasks']
)

# Celery Configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes max per task
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Periodic Task Schedule
celery_app.conf.beat_schedule = {
    # ==================== Discovery Loops (Slow, Expensive) ====================

    'youtube-discovery': {
        'task': 'workers.tasks.youtube_discovery',
        'schedule': 30.0 * 60,  # Every 30 minutes (as per spec)
        'options': {'queue': 'discovery'}
    },

    'twitch-discovery': {
        'task': 'workers.tasks.twitch_discovery',
        'schedule': 5.0 * 60,  # Every 5 minutes (Twitch is cheaper)
        'options': {'queue': 'discovery'}
    },

    # ==================== Liveness Loops (Fast, Cheap) ====================

    'youtube-liveness-check': {
        'task': 'workers.tasks.youtube_liveness_check',
        'schedule': 120.0,  # Every 2 minutes
        'options': {'queue': 'liveness'}
    },

    'twitch-liveness-check': {
        'task': 'workers.tasks.twitch_liveness_check',
        'schedule': 60.0,  # Every 1 minute (very cheap)
        'options': {'queue': 'liveness'}
    },

    # ==================== Maintenance Tasks ====================

    'reset-daily-quotas': {
        'task': 'workers.tasks.reset_daily_quotas',
        'schedule': crontab(hour=0, minute=0),  # Midnight UTC
        'options': {'queue': 'maintenance'}
    },

    'cleanup-old-streams': {
        'task': 'workers.tasks.cleanup_old_streams',
        'schedule': crontab(hour=3, minute=0),  # 3 AM UTC
        'options': {'queue': 'maintenance'}
    },

    'update-channel-priorities': {
        'task': 'workers.tasks.update_channel_priorities',
        'schedule': 60.0 * 60,  # Every hour
        'options': {'queue': 'maintenance'}
    },
}

# Queue configuration
celery_app.conf.task_routes = {
    'workers.tasks.youtube_discovery': {'queue': 'discovery'},
    'workers.tasks.twitch_discovery': {'queue': 'discovery'},
    'workers.tasks.youtube_liveness_check': {'queue': 'liveness'},
    'workers.tasks.twitch_liveness_check': {'queue': 'liveness'},
}
