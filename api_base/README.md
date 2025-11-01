
# API Base (Mock) for Frontend Integration

## Run
```bash
pip install -r requirements.txt
uvicorn main:app --reload --app-dir .
```

Open docs: http://localhost:8000/docs

Endpoints:
- `GET /health`
- `POST /predict`
- `POST /predict-batch`
- `GET /model/info`
```
