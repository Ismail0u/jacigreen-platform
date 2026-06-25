"""
Tests du module d'intelligence artificielle.

Ce fichier vérifie plusieurs comportements essentiels du système IA :

- La classification des niveaux de confiance des détections.
- La génération correcte du chemin du modèle IA.
- La lecture des images depuis le stockage local.
- L'enregistrement des routes API liées à l'analyse IA.

Ces tests garantissent que les composants principaux du pipeline IA
fonctionnent avant un déploiement.
"""

import pytest

from app.main import app
from app.workers import ai_tasks


def test_confidence_label_thresholds():
    """
    Vérifie que les seuils de confiance IA sont correctement classés.

    Les résultats du modèle sont convertis en trois niveaux :

    HIGH :
        Détection fiable.

    MEDIUM :
        Détection moyenne nécessitant une attention.

    LOW :
        Détection faible.

    Exemple :
        0.75 -> HIGH
        0.50 -> MEDIUM
        0.35 -> LOW
    """

    assert ai_tasks._confidence_label(0.75) == "HIGH"
    assert ai_tasks._confidence_label(0.50) == "MEDIUM"
    assert ai_tasks._confidence_label(0.35) == "LOW"



def test_model_path_is_absolute():
    """
    Vérifie que le chemin du modèle IA retourné est absolu.

    Un chemin absolu évite les erreurs liées au dossier
    depuis lequel l'application est exécutée.
    """

    path = ai_tasks._model_path()

    assert path.is_absolute()



@pytest.mark.asyncio
async def test_read_image_bytes_supports_local_storage_url(
    tmp_path,
    monkeypatch
):
    """
    Vérifie que le système peut lire une image stockée localement.

    Le test simule un fichier image dans le dossier storage/photos
    et vérifie que le service retourne correctement ses octets.

    monkeypatch est utilisé pour simuler l'emplacement réel
    du fichier dans l'environnement de test.
    """

    backend_dir = tmp_path / "backend"

    storage_dir = backend_dir / "storage" / "photos"

    storage_dir.mkdir(parents=True)


    image_path = storage_dir / "sample.jpg"

    image_path.write_bytes(b"image-bytes")


    class FakePath:
        """
        Simule le chemin du fichier source ai_tasks.py.
        """

        @staticmethod
        def resolve():
            return backend_dir / "app" / "workers" / "ai_tasks.py"


    monkeypatch.setattr(
        ai_tasks,
        "__file__",
        str(FakePath.resolve())
    )


    assert await ai_tasks._read_image_bytes(
        "/storage/photos/sample.jpg"
    ) == b"image-bytes"



def test_ai_routes_are_registered():
    """
    Vérifie que les routes API liées à l'IA
    sont bien enregistrées dans FastAPI.

    Ces endpoints permettent :
    - de lancer une analyse IA
    - de consulter l'état d'une tâche
    - de récupérer les détections générées
    """

    paths = {
        route.path
        for route in app.routes
    }


    assert "/api/v1/ai/analyze/{mission_id}" in paths
    assert "/api/v1/ai/tasks/{task_id}" in paths
    assert "/api/v1/ai/missions/{mission_id}/detections" in paths
    assert "/api/v1/missions/{mission_id}/detections" in paths