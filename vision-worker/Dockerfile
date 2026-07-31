FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    VISION_WORKER_ROOT=/var/lib/socceroneman-vision

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py ./
RUN useradd --create-home --uid 10001 vision \
    && mkdir -p /var/lib/socceroneman-vision \
    && chown -R vision:vision /app /var/lib/socceroneman-vision

USER vision
EXPOSE 8123

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8123", "--proxy-headers"]
