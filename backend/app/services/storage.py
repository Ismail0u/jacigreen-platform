from supabase import create_client

from app.core.config import settings

supabase = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_KEY,
)


def upload_photo(filename: str, content: bytes, content_type: str) -> str:
    """
    Upload une photo dans le bucket Supabase et retourne son URL publique.
    """

    bucket = settings.SUPABASE_STORAGE_BUCKET

    supabase.storage.from_(bucket).upload(
        path=filename,
        file=content,
        file_options={
            "content-type": content_type,
            "upsert": False,
        },
    )

    return supabase.storage.from_(bucket).get_public_url(filename)