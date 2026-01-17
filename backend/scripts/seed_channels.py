"""
Seed script to populate initial high-trust channels.
These are the "seed channels" mentioned in the spec for RSS monitoring.
"""

import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from models.database import DatabaseManager
from models.channel import Channel
from models.stream import Platform

# Curated list of high-trust channels for protest coverage
SEED_CHANNELS = {
    Platform.YOUTUBE: [
        {
            "platform_channel_id": "UCupvZG-5ko_eiXAupbDfxWw",  # CNN
            "display_name": "CNN",
            "trust_score": 1.0,
            "category": "news_org"
        },
        {
            "platform_channel_id": "UCeY0bbntWzzVIaj2z3QigXg",  # NBC News
            "display_name": "NBC News",
            "trust_score": 1.0,
            "category": "news_org"
        },
        {
            "platform_channel_id": "UCAKcSON6PSG_JkTbXh2WdIg",  # The Guardian
            "display_name": "The Guardian",
            "trust_score": 1.0,
            "category": "news_org"
        },
        {
            "platform_channel_id": "UCHpw8xwDNhU9gdohEcJu4aA",  # The Young Turks
            "display_name": "The Young Turks",
            "trust_score": 0.9,
            "category": "news_org"
        },
        {
            "platform_channel_id": "UCBi2mrWuNuyYy4gbM6fU18Q",  # ABC News
            "display_name": "ABC News",
            "trust_score": 1.0,
            "category": "news_org"
        },
        {
            "platform_channel_id": "UC52X5wxOL_s5yw0dQk7NtgA",  # Democracy Now!
            "display_name": "Democracy Now!",
            "trust_score": 0.9,
            "category": "news_org"
        },
        {
            "platform_channel_id": "UCBJycsmduvYEL83R_U4JriQ",  # MSNBC
            "display_name": "MSNBC",
            "trust_score": 1.0,
            "category": "news_org"
        },
    ],
    Platform.TWITCH: [
        {
            "platform_channel_id": "hasanabi",  # HasanAbi (political commentary)
            "display_name": "HasanAbi",
            "trust_score": 0.8,
            "category": "activist"
        },
    ]
}


async def seed_channels():
    """Populate database with seed channels."""
    database_url = os.getenv('DATABASE_URL')

    if not database_url:
        print("ERROR: DATABASE_URL not set")
        return

    db = DatabaseManager(database_url)

    try:
        await db.connect()
        print("Connected to database")

        total = 0

        for platform, channels in SEED_CHANNELS.items():
            print(f"\nSeeding {platform.value} channels...")

            for channel_data in channels:
                channel = Channel(
                    platform=platform,
                    platform_channel_id=channel_data["platform_channel_id"],
                    display_name=channel_data["display_name"],
                    trust_score=channel_data["trust_score"]
                )

                channel_id = await db.upsert_channel(channel)

                # Add to seed_channels table
                async with db.pool.acquire() as conn:
                    await conn.execute(
                        """
                        INSERT INTO seed_channels (channel_id, category, priority)
                        VALUES ($1, $2, $3)
                        ON CONFLICT (channel_id) DO NOTHING
                        """,
                        channel_id,
                        channel_data["category"],
                        1
                    )

                print(f"  ✓ {channel_data['display_name']}")
                total += 1

        print(f"\n✅ Successfully seeded {total} channels")

    except Exception as e:
        print(f"❌ Error seeding channels: {e}")

    finally:
        await db.disconnect()


if __name__ == "__main__":
    asyncio.run(seed_channels())
