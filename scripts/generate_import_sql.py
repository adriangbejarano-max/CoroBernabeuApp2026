import math
import argparse
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


def first_existing(row, names):
    for name in names:
        value = clean(row.get(name))
        if value:
            return value
    return ""


def find_column(df, contains):
    for column in df.columns:
        normalized = clean(column).upper()
        if all(part in normalized for part in contains):
            return column
    return None


def row_values(row, index, accreditation_column):
    dni = clean(row.get("DNI")).upper()
    name = " ".join([clean(row.get("NOMBRE")), clean(row.get("APELLIDOS"))]).strip()
    if not name:
        return None
    attendee_id = uuid.uuid5(NAMESPACE, f"{dni}|{name}")
    cargo = clean(row.get("CARGO"))
    group = clean(row.get("Parroquia, colegio, movimiento al que perteneces\n"))
    accreditation = first_existing(row, ["ACREDITACIÓN", "ZONA", accreditation_column])
    notes_parts = []
    if cargo:
        notes_parts.append(f"Cargo original: {cargo}")
    size = clean(row.get("TALLA CAMISETA"))
    if size:
        notes_parts.append(f"Talla camiseta: {size}")
    return {
        "key": (dni, name.upper()),
        "sql": "("
        + ", ".join(
            [
                sql(str(attendee_id)),
                sql(dni),
                sql(name),
                sql(category_from_cargo(cargo)),
                sql(group),
                sql(row.get("CORREO ELECTRÓNICO")),
                sql_date(row.get("FECHA DE NACIMIENTO")),
                sql(accreditation),
                sql("excel"),
                sql(row.get("TELÉFONO MÓVIL")),
                sql(" | ".join(notes_parts)),
            ]
        )
        + ")",
    }


def generate_full_import(df, input_path, output):
    lines = [
        f"-- Generado desde {input_path.name}",
        "-- Ejecuta primero supabase-schema.sql.",
        "begin;",
        "insert into public.attendees (id, dni, full_name, category, group_name, email, birth_date, accreditation, source, phone, notes)",
        "values",
    ]

    accreditation_column = find_column(df, ["ACREDIT"])
    values = []
    for index, row in df.iterrows():
        item = row_values(row, index, accreditation_column)
        if item:
            values.append(item["sql"])

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
            "  source = excluded.source,",
            "  phone = excluded.phone,",
            "  notes = excluded.notes;",
            "commit;",
            "",
        ]
    )
    output.write_text("\n".join(lines), encoding="utf-8")
    print(f"Generated {output} with {len(values)} attendees")


def generate_incremental_import(df, input_path, output):
    accreditation_column = find_column(df, ["ACREDIT"])
    values = []
    seen = set()
    duplicates = 0
    for index, row in df.iterrows():
        item = row_values(row, index, accreditation_column)
        if not item:
            continue
        if item["key"] in seen:
            duplicates += 1
            continue
        seen.add(item["key"])
        values.append(item["sql"])

    lines = [
        f"-- Importacion incremental generada desde {input_path.name}",
        "-- No borra asistentes ni check-ins.",
        "-- Actualiza por DNI + nombre completo; inserta los que no existan.",
        "begin;",
        "create temp table import_attendees (",
        "  id uuid,",
        "  dni text,",
        "  full_name text,",
        "  category text,",
        "  group_name text,",
        "  email text,",
        "  birth_date date,",
        "  accreditation text,",
        "  source text,",
        "  phone text,",
        "  notes text",
        ");",
        "insert into import_attendees (id, dni, full_name, category, group_name, email, birth_date, accreditation, source, phone, notes)",
        "values",
        ",\n".join(values) + ";",
        "update public.attendees as attendee",
        "set",
        "  dni = imported.dni,",
        "  full_name = imported.full_name,",
        "  category = imported.category,",
        "  group_name = imported.group_name,",
        "  email = imported.email,",
        "  birth_date = imported.birth_date,",
        "  accreditation = imported.accreditation,",
        "  source = imported.source,",
        "  phone = imported.phone,",
        "  notes = imported.notes",
        "from import_attendees as imported",
        "where upper(trim(coalesce(attendee.dni, ''))) = upper(trim(coalesce(imported.dni, '')))",
        "  and lower(trim(coalesce(attendee.full_name, ''))) = lower(trim(coalesce(imported.full_name, '')));",
        "insert into public.attendees (id, dni, full_name, category, group_name, email, birth_date, accreditation, source, phone, notes)",
        "select imported.id, imported.dni, imported.full_name, imported.category, imported.group_name, imported.email, imported.birth_date, imported.accreditation, imported.source, imported.phone, imported.notes",
        "from import_attendees as imported",
        "where not exists (",
        "  select 1",
        "  from public.attendees as attendee",
        "  where upper(trim(coalesce(attendee.dni, ''))) = upper(trim(coalesce(imported.dni, '')))",
        "    and lower(trim(coalesce(attendee.full_name, ''))) = lower(trim(coalesce(imported.full_name, '')))",
        ");",
        "commit;",
        "",
    ]
    output.write_text("\n".join(lines), encoding="utf-8")
    print(f"Generated {output} with {len(values)} attendees ({duplicates} duplicate rows skipped)")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default=str(INPUT))
    parser.add_argument("--output", default=str(OUTPUT))
    parser.add_argument("--mode", choices=["full", "incremental"], default="full")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)
    df = pd.read_excel(input_path)
    if args.mode == "incremental":
        generate_incremental_import(df, input_path, output_path)
    else:
        generate_full_import(df, input_path, output_path)


if __name__ == "__main__":
    main()
