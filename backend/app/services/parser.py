"""Basic metadata + lab-value extraction for uploaded files.

PDFs with a text layer are parsed with pypdf and scanned with regular expressions.
Images only get dimension metadata; plug an OCR engine into `parse_file` to read them.
"""
import re
from dataclasses import dataclass
from io import BytesIO
from typing import Any, Optional

from PIL import Image
from pypdf import PdfReader


@dataclass(frozen=True)
class FileKind:
    content_type: str
    ext: str


def sniff(data: bytes) -> Optional[FileKind]:
    """Detect the real file type from magic bytes, ignoring client-supplied headers."""
    if data.startswith(b"%PDF"):
        return FileKind("application/pdf", ".pdf")
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return FileKind("image/png", ".png")
    if data.startswith(b"\xff\xd8\xff"):
        return FileKind("image/jpeg", ".jpg")
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return FileKind("image/webp", ".webp")
    return None


_NUM = r"(\d{1,3}(?:\.\d+)?)"
PATTERNS = {
    "hba1c": re.compile(rf"hb\s?a1c[^0-9]{{0,20}}{_NUM}", re.I),
    "total_cholesterol": re.compile(rf"total\s+cholesterol[^0-9]{{0,20}}{_NUM}", re.I),
    "ldl": re.compile(rf"\bldl(?:\s+cholesterol)?[^0-9]{{0,20}}{_NUM}", re.I),
}
BP = re.compile(r"\b(?:blood\s+pressure|bp)\b[^0-9]{0,20}(\d{2,3})\s*/\s*(\d{2,3})", re.I)
ISO_DATE = re.compile(r"\b(\d{4}-\d{2}-\d{2})\b")


def extract_values(text: str) -> dict[str, float]:
    values: dict[str, float] = {}
    for key, pattern in PATTERNS.items():
        if m := pattern.search(text):
            values[key] = float(m.group(1))
    if m := BP.search(text):
        values["systolic"], values["diastolic"] = float(m.group(1)), float(m.group(2))
    return values


def evaluate(values: dict[str, float]) -> list[dict[str, Any]]:
    """Flag values outside typical adult reference ranges. These are screening hints, not diagnoses."""
    flags: list[dict[str, Any]] = []

    def add(param: str, level: str, message: str) -> None:
        flags.append({"parameter": param, "value": values[param], "level": level, "message": message})

    if (v := values.get("hba1c")) is not None:
        if v >= 6.5:
            add("hba1c", "high", f"HbA1c of {v}% is at or above 6.5%.")
        elif v >= 5.7:
            add("hba1c", "caution", f"HbA1c of {v}% is above 5.7%.")
    if (v := values.get("total_cholesterol")) is not None:
        if v >= 240:
            add("total_cholesterol", "high", f"Total cholesterol of {v:g} mg/dL is at or above 240.")
        elif v >= 200:
            add("total_cholesterol", "caution", f"Total cholesterol of {v:g} mg/dL is above 200.")
    if (v := values.get("ldl")) is not None:
        if v >= 160:
            add("ldl", "high", f"LDL of {v:g} mg/dL is at or above 160.")
        elif v >= 130:
            add("ldl", "caution", f"LDL of {v:g} mg/dL is above 130.")
    if (s := values.get("systolic")) is not None and (d := values.get("diastolic")) is not None:
        if s >= 140 or d >= 90:
            add("systolic", "high", f"Blood pressure of {s:g}/{d:g} mmHg is at or above 140/90.")
        elif s >= 130 or d >= 80:
            add("systolic", "caution", f"Blood pressure of {s:g}/{d:g} mmHg is above 130/80.")
    return flags


def parse_with_text(data: bytes, content_type: str) -> tuple[dict[str, Any], str]:
    """Like `parse_file`, but also returns the raw extracted text (empty for images / scans)."""
    metadata: dict[str, Any] = {"content_type": content_type, "size_bytes": len(data)}
    text = ""
    if content_type == "application/pdf":
        reader = PdfReader(BytesIO(data))
        metadata["pages"] = len(reader.pages)
        if reader.metadata and reader.metadata.title:
            metadata["title"] = str(reader.metadata.title)[:200]
        text = "\n".join((page.extract_text() or "") for page in reader.pages[:25])
    else:
        with Image.open(BytesIO(data)) as img:
            img.verify()
        with Image.open(BytesIO(data)) as img:  # verify() invalidates the handle
            metadata.update(width=img.width, height=img.height, format=img.format)

    values = extract_values(text)
    date_match = ISO_DATE.search(text)
    result = {
        "metadata": metadata,
        "values": values,
        "flags": evaluate(values),
        "report_date": date_match.group(1) if date_match else None,
        "text_extracted": bool(text.strip()),
    }
    return result, text


def parse_file(data: bytes, content_type: str) -> dict[str, Any]:
    return parse_with_text(data, content_type)[0]
