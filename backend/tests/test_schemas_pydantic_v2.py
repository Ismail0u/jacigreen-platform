"""
Tests des schémas de données API.

Ce fichier vérifie que les modèles Pydantic utilisés par l'API :

- acceptent les données entrantes correctement.
- peuvent être convertis en dictionnaires.
- supportent la validation depuis des objets Python.
- exposent les champs attendus dans les réponses API.

Les schémas testés :
- MissionCreate : création d'une mission.
- MissionRead : réponse API d'une mission.
- PhotoRead : réponse API d'une photo.
"""


from datetime import datetime
from uuid import uuid4

from app.schemas.mission import MissionCreate, MissionRead
from app.schemas.photo import PhotoRead



def test_mission_create_uses_model_dump():
    """
    Vérifie que le schéma MissionCreate peut être sérialisé.

    model_dump() permet de transformer un objet Pydantic
    en dictionnaire utilisable pour :
    - insertion en base
    - réponse API
    - traitement interne
    """

    payload = MissionCreate(
        name="Mission Fleuve Niger"
    )

    assert payload.model_dump()["name"] == "Mission Fleuve Niger"



def test_mission_read_accepts_attributes():
    """
    Vérifie que MissionRead peut être construit depuis
    un objet Python contenant des attributs.

    Ce comportement est utile avec SQLAlchemy,
    car les modèles ORM exposent des attributs
    et non des dictionnaires.
    """

    class MissionObject:
        id = uuid4()
        name = "Mission attributs"
        description = None
        status = "draft"
        mission_date = None
        flight_path = None
        zone_id = None
        operator_id = None
        notes = None
        created_at = datetime.utcnow()
        completed_at = None


    mission = MissionRead.model_validate(
        MissionObject()
    )

    assert mission.name == "Mission attributs"



def test_photo_read_exposes_latitude_longitude_without_location():
    """
    Vérifie que le schéma PhotoRead expose les coordonnées GPS.

    L'API utilise latitude/longitude pour faciliter
    l'affichage cartographique (ex: Leaflet).

    Le champ PostGIS interne "location" ne doit pas être
    exposé directement dans la réponse API.
    """

    photo = PhotoRead(
        id=uuid4(),
        mission_id=uuid4(),
        filename="photo.jpg",
        storage_url="/storage/photos/photo.jpg",

        # Coordonnées utilisées côté frontend.
        latitude=13.5137,
        longitude=2.1168,

        created_at=datetime.utcnow(),
    )


    dumped = photo.model_dump()


    assert dumped["latitude"] == 13.5137
    assert dumped["longitude"] == 2.1168

    # Vérifie que le champ interne PostGIS reste caché.
    assert "location" not in dumped