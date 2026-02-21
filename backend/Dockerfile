FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install uv
RUN pip install uv

# Copy dependencies config
COPY pyproject.toml ./

# Install directly into system python
RUN uv pip install --system --no-cache -r pyproject.toml

# Copy source
COPY . .

# Run without reload
CMD ["uvicorn", "src:app", "--host", "0.0.0.0", "--port", "8000"]
