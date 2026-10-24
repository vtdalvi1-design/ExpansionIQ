from app.services.geo_analysis import haversine_distance


def test_same_location_distance_is_zero():
    distance = haversine_distance(19.0760, 72.8777, 19.0760, 72.8777)

    assert distance == 0


def test_distance_is_symmetric():
    first = haversine_distance(19.0760, 72.8777, 18.5204, 73.8567)
    second = haversine_distance(18.5204, 73.8567, 19.0760, 72.8777)

    assert abs(first - second) < 1e-9


def test_invalid_coordinates_are_rejected():
    try:
        haversine_distance(91, 0, 0, 0)
    except ValueError:
        pass
    else:
        raise AssertionError("Invalid latitude must be rejected.")