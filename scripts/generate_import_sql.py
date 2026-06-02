import math
import uuid
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "data" / "asistentes.xlsx"
OUTPUT = ROOT / "data" / "import-attendees.sql"
NAMESPACE = uuid.UUID("4f8b39f4-d6b3-4ffb-a922-coro00000001".replace("coro", "c0f0"))


def clean(value):
    if value is None:
        return ""
    if isinstance(value, float) and math.isnan(value):
        return ""
    return str(value).strip()


def sql(value):
    value = clean(value)
    if not value:
        return "''"
    return "'" + value.replace("'", "''") + "'"


def sql_date(value):
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return "null"
    if hasattr(value, "strftime"):
        return "'" + value.strftime("%Y-%m-%d") + "'"
    value = clean(value)
    if not value:
        return "null"
    parsed = pd.to_datetime(value, errors="coerce")
    if pd.isna(parsed):
        return "null"
    return "'" + parsed.strftime("%Y-%m-%d") + "'"


def category_from_cargo(cargo):
    normalized = clean(cargo).upper()
    if not normalized:
        return "Cantante"
    if "BAILE" in normalized:
        return "Bailarin"
    if "ORQUESTA" in normalized or "MUSICO" in normalized or "MÚSICO" in normalized:
        return "Orquesta"
    if "PRODU" in normalized:
        return "Productor"
    if "SOLISTA" in normalized:
        return "Solista"
    if "TECNICO" in normalized or "TÉCNICO" in normalized:
        return "Tecnico"
    return "Staff"


def main():
    df = pd.read_excel(INPUT)
    lines = [
        "-- Generado desde data/asistentes.xlsx",
        "-- Ejecuta primero supabase-schema.sql.",
        "begin;",
        "insert into public.attendees (id, dni, full_name, category, group_name, email, birth_date, accreditation, phone, notes)",
        "values",
    ]

    values = []
    for index, row in df.iterrows():
        dni = clean(row.get("DNI")).upper()
        name = " ".join([clean(row.get("NOMBRE")), clean(row.get("APELLIDOS"))]).strip()
        if not name:
            continue
        attendee_id = uuid.uuid5(NAMESPACE, f"{index}|{dni}|{name}")
        cargo = clean(row.get("CARGO"))
        group = clean(row.get("Parroquia, colegio, movimiento al que perteneces\n"))
        notes = f"Cargo original: {cargo}" if cargo else ""
        values.append(
            "("
            + ", ".join(
                [
                    sql(str(attendee_id)),
                    sql(dni),
                    sql(name),
                    sql(category_from_cargo(cargo)),
                    sql(group),
                    sql(row.get("CORREO ELECTRÓNICO")),
                    sql_date(row.get("FECHA DE NACIMIENTO")),
                    sql(row.get("ACREDITACIÓN")),
                    sql(row.get("TELÉFONO MÓVIL")),
                    sql(notes),
                ]
            )
            + ")"
        )

    lines.append(",\n".join(values))
    lines.extend(
        [
            "on conflict (id) do update set",
            "  dni = excluded.dni,",
            "  full_name = excluded.full_name,",
            "  category = excluded.category,",
            "  group_name = excluded.group_name,",
            "  email = excluded.email,",
            "  birth_date = excluded.birth_date,",
            "  accreditation = excluded.accreditation,",
            "  phone = excluded.phone,",
            "  notes = excluded.notes;",
            "commit;",
            "",
        ]
    )
    OUTPUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Generated {OUTPUT} with {len(values)} attendees")


if __name__ == "__main__":
    main()
