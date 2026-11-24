FROM python:3.14-slim
ARG WHL
WORKDIR /app
COPY dist/${WHL} .
RUN pip install --no-cache-dir ${WHL}
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]