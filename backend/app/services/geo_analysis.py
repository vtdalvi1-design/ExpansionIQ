import math

EARTH_RADIUS_KM = 6371.0088


def haversine_distance(
    latitude_a: float,
    longitude_a: float,
    latitude_b: float,
    longitude_b: float,
) -> float:
    coordinates = (latitude_a, longitude_a, latitude_b, longitude_b)
    if any(
        isinstance(value, bool) or not math.isfinite(value)
        for value in coordinates
    ):
        raise ValueError("Coordinates must be finite numbers.")

    if not -90 <= latitude_a <= 90 or not -90 <= latitude_b <= 90:
        raise ValueError("Latitude must be between -90 and 90 degrees.")
    if not -180 <= longitude_a <= 180 or not -180 <= longitude_b <= 180:
        raise ValueError("Longitude must be between -180 and 180 degrees.")

    latitude_a_rad, latitude_b_rad = map(
        math.radians,
        (latitude_a, latitude_b),
    )
    latitude_delta = math.radians(latitude_b - latitude_a)
    longitude_delta = math.radians(longitude_b - longitude_a)

    haversine = (
        math.sin(latitude_delta / 2) ** 2
        + math.cos(latitude_a_rad)
        * math.cos(latitude_b_rad)
        * math.sin(longitude_delta / 2) ** 2
    )
    haversine = min(1.0, max(0.0, haversine))
    central_angle = 2 * math.atan2(
        math.sqrt(haversine),
        math.sqrt(1 - haversine),
    )
    return EARTH_RADIUS_KM * central_angle