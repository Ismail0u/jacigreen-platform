from dataclasses import dataclass
from datetime import datetime
from typing import Optional

import piexif

"""
EXIF Service for extracting GPS data from image files.
This module provides functionality to extract GPS coordinates and other relevant metadata from the EXIF data of image
    files. It defines a GpsData dataclass to hold the extracted information and provides utility functions to convert DMS (Degrees, Minutes, Seconds) format to decimal degrees and to parse the capture date and time from the EXIF data.
    extract_gps function is the main entry point that takes image bytes as input and returns a GpsData instance containing the extracted GPS information.
    exif_dict is used to load the EXIF data from the image bytes, and the GPS information is extracted from the GPS IFD (Image File Directory) within the EXIF data.
    The module handles potential errors in reading EXIF data and raises appropriate exceptions when GPS data is
    missing or incomplete.
    service is useful for applications that need to process images and extract location information, such as mapping, geotagging, or location-based services.
    gps_ifd is a dictionary containing the GPS-related EXIF tags, and the module checks for the presence of required tags before attempting to extract latitude, longitude, altitude, and capture date.
    The module also includes helper functions to convert DMS coordinates to decimal format and to parse the
    capture date and time from the EXIF data, ensuring that the extracted information is accurate and usable for further processing or analysis.
"""
@dataclass
class GpsData:
    latitude: float
    longitude: float
    altitude: Optional[float] = None
    captured_at: Optional[datetime] = None


def _dms_to_decimal(dms, ref: bytes) -> float:
    degrees = dms[0][0] / dms[0][1]
    minutes = dms[1][0] / dms[1][1]
    seconds = dms[2][0] / dms[2][1]
    decimal = degrees + minutes / 60.0 + seconds / 3600.0
    if ref.decode().upper() in {"S", "W"}:
        decimal = -decimal
    return decimal


def _parse_datetime(exif_dict: dict) -> Optional[datetime]:
    try:
        raw_date = exif_dict.get("Exif", {}).get(piexif.ExifIFD.DateTimeOriginal)
        if raw_date:
            return datetime.strptime(raw_date.decode("utf-8"), "%Y:%m:%d %H:%M:%S")
    except (ValueError, AttributeError, TypeError):
        pass
    return None


def extract_gps(image_bytes: bytes) -> GpsData:
    try:
        exif_dict = piexif.load(image_bytes)
    except Exception as exc:
        raise ValueError("Impossible de lire les métadonnées EXIF") from exc

    gps_ifd = exif_dict.get("GPS") or {}
    if not gps_ifd:
        raise ValueError("Aucune donnée GPS EXIF trouvée")

    latitude = gps_ifd.get(piexif.GPSIFD.GPSLatitude)
    latitude_ref = gps_ifd.get(piexif.GPSIFD.GPSLatitudeRef)
    longitude = gps_ifd.get(piexif.GPSIFD.GPSLongitude)
    longitude_ref = gps_ifd.get(piexif.GPSIFD.GPSLongitudeRef)

    if not latitude or not latitude_ref or not longitude or not longitude_ref:
        raise ValueError("Données GPS EXIF incomplètes")

    lat = _dms_to_decimal(latitude, latitude_ref)
    lng = _dms_to_decimal(longitude, longitude_ref)

    altitude = None
    if piexif.GPSIFD.GPSAltitude in gps_ifd:
        alt_value = gps_ifd[piexif.GPSIFD.GPSAltitude]
        if isinstance(alt_value, tuple) and alt_value[1] != 0:
            altitude = alt_value[0] / alt_value[1]

    captured_at = _parse_datetime(exif_dict)

    return GpsData(latitude=lat, longitude=lng, altitude=altitude, captured_at=captured_at)
