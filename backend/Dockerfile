FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps for psycopg2 build (binary wheel usually suffices, but keep libpq)
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

RUN chmod +x start.sh \
    && groupadd --system --gid 1001 keychain \
    && useradd --system --uid 1001 --gid keychain --no-create-home --shell /usr/sbin/nologin keychain \
    && chown -R keychain:keychain /app

USER keychain

EXPOSE 8000

CMD ["./start.sh"]
