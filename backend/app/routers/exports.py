import csv
import io

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.schemas import ExportRequest

router = APIRouter(prefix="/exports", tags=["Exports"])


@router.post("/csv")
def export_csv(payload: ExportRequest) -> StreamingResponse:
    output = io.StringIO()
    columns = [
        "city_name",
        "category",
        "rank",
        "total_score",
        "score_status",
        "demand_score",
        "competition_score",
        "accessibility_score",
        "cost_score",
        "category_fit_score",
        "source",
        "source_status",
        "notes",
        "missing_factors",
    ]

    writer = csv.DictWriter(output, fieldnames=columns, extrasaction="ignore")
    writer.writeheader()

    for result in payload.results:
        row = dict(result)
        if isinstance(row.get("missing_factors"), list):
            row["missing_factors"] = "; ".join(row["missing_factors"])

        writer.writerow(row)

    content = io.BytesIO(output.getvalue().encode("utf-8-sig"))
    content.seek(0)

    return StreamingResponse(
        content,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": 'attachment; filename="expansioniq-results.csv"'
        },
    )